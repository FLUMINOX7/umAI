"""Tests de la route POST /api/rag/query/voice."""

import io
import json
import os
from unittest.mock import MagicMock, patch

URL = "/api/rag/query/voice"


def _audio(filename="question.mp3", data=b"FAKEAUDIOBYTES"):
    return {"audio": (io.BytesIO(data), filename)}


def _rag_result(answer="42", context="ctx", sources=None):
    return MagicMock(answer=answer, context=context, sources=sources or ["doc.pdf"])


# --------------------------------------------------------------------------- #
# Authentification et validation de l'entrée
# --------------------------------------------------------------------------- #

def test_requires_jwt(client):
    resp = client.post(URL)
    assert resp.status_code == 401


def test_missing_audio_returns_400(client, auth_headers):
    resp = client.post(URL, headers=auth_headers)
    assert resp.status_code == 400
    assert "audio file is required" in resp.get_json()["error"]


def test_filename_sanitized_to_empty_returns_400(client, auth_headers):
    # ".." est nettoyé en chaîne vide par secure_filename -> nom invalide
    resp = client.post(
        URL, headers=auth_headers,
        data={"audio": (io.BytesIO(b"x"), "..")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400
    assert "name cannot be empty" in resp.get_json()["error"]


# --------------------------------------------------------------------------- #
# Chemin nominal
# --------------------------------------------------------------------------- #

def test_happy_path_returns_transcription_and_answer(client, auth_headers, rag_module):
    with patch.object(rag_module, "TranscriptionService") as MT, \
         patch.object(rag_module, "RagService") as MR:
        MT.return_value.transcribe.return_value = "quelle est la reponse ?"
        MR.return_value.ask.return_value = _rag_result()

        resp = client.post(
            URL, headers=auth_headers,
            data=_audio(), content_type="multipart/form-data",
        )

    assert resp.status_code == 200
    body = resp.get_json()
    assert body["transcription"] == "quelle est la reponse ?"
    assert body["answer"] == "42"
    assert body["context"] == "ctx"
    assert body["sources"] == ["doc.pdf"]


# --------------------------------------------------------------------------- #
# Le bug corrigé : les paramètres de formulaire sont bien transmis
# --------------------------------------------------------------------------- #

def test_form_params_are_forwarded_to_rag(client, auth_headers, rag_module):
    history = [{"role": "user", "content": "salut"}]
    with patch.object(rag_module, "TranscriptionService") as MT, \
         patch.object(rag_module, "RagService") as MR:
        MT.return_value.transcribe.return_value = "ma question"
        MR.return_value.ask.return_value = _rag_result()

        data = _audio()
        data["top_k"] = "7"
        data["model"] = "mon-modele"
        data["conversation_history"] = json.dumps(history)
        resp = client.post(
            URL, headers=auth_headers,
            data=data, content_type="multipart/form-data",
        )

    assert resp.status_code == 200
    _, kwargs = MR.return_value.ask.call_args
    assert kwargs["question"] == "ma question"
    assert kwargs["top_k"] == 7              # converti str -> int
    assert kwargs["model"] == "mon-modele"
    assert kwargs["conversation_history"] == history  # JSON parsé en liste


def test_invalid_params_fall_back_to_none(client, auth_headers, rag_module):
    with patch.object(rag_module, "TranscriptionService") as MT, \
         patch.object(rag_module, "RagService") as MR:
        MT.return_value.transcribe.return_value = "q"
        MR.return_value.ask.return_value = _rag_result()

        data = _audio()
        data["top_k"] = "pas-un-entier"
        data["conversation_history"] = "{json invalide"
        resp = client.post(
            URL, headers=auth_headers,
            data=data, content_type="multipart/form-data",
        )

    assert resp.status_code == 200
    _, kwargs = MR.return_value.ask.call_args
    assert kwargs["top_k"] is None
    assert kwargs["conversation_history"] is None


def test_non_list_history_is_ignored(client, auth_headers, rag_module):
    with patch.object(rag_module, "TranscriptionService") as MT, \
         patch.object(rag_module, "RagService") as MR:
        MT.return_value.transcribe.return_value = "q"
        MR.return_value.ask.return_value = _rag_result()

        data = _audio()
        data["conversation_history"] = json.dumps({"role": "user"})  # dict, pas liste
        resp = client.post(
            URL, headers=auth_headers,
            data=data, content_type="multipart/form-data",
        )

    assert resp.status_code == 200
    _, kwargs = MR.return_value.ask.call_args
    assert kwargs["conversation_history"] is None


# --------------------------------------------------------------------------- #
# Erreurs métier
# --------------------------------------------------------------------------- #

def test_empty_transcription_returns_400(client, auth_headers, rag_module):
    with patch.object(rag_module, "TranscriptionService") as MT:
        # transcribe() applique deja .strip() -> chaine vide si audio muet
        MT.return_value.transcribe.return_value = ""
        resp = client.post(
            URL, headers=auth_headers,
            data=_audio(), content_type="multipart/form-data",
        )
    assert resp.status_code == 400
    assert "failed to transcribe" in resp.get_json()["error"]


def test_rag_service_error_returns_400(client, auth_headers, rag_module):
    with patch.object(rag_module, "TranscriptionService") as MT, \
         patch.object(rag_module, "RagService") as MR:
        MT.return_value.transcribe.return_value = "q"
        MR.return_value.ask.side_effect = rag_module.RagServiceError("index absent")
        resp = client.post(
            URL, headers=auth_headers,
            data=_audio(), content_type="multipart/form-data",
        )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "index absent"


def test_unexpected_error_returns_500(client, auth_headers, rag_module):
    with patch.object(rag_module, "TranscriptionService") as MT, \
         patch.object(rag_module, "RagService") as MR:
        MT.return_value.transcribe.return_value = "q"
        MR.return_value.ask.side_effect = RuntimeError("boom")
        resp = client.post(
            URL, headers=auth_headers,
            data=_audio(), content_type="multipart/form-data",
        )
    assert resp.status_code == 500


# --------------------------------------------------------------------------- #
# Sécurité & nettoyage du fichier temporaire
# --------------------------------------------------------------------------- #

def test_temp_file_is_cleaned_up(client, auth_headers, rag_module):
    captured = {}

    class FakeTranscriber:
        def transcribe(self, path):
            captured["path"] = path
            captured["exists_during"] = os.path.exists(path)
            return "q"

    with patch.object(rag_module, "TranscriptionService", return_value=FakeTranscriber()), \
         patch.object(rag_module, "RagService") as MR:
        MR.return_value.ask.return_value = _rag_result()
        resp = client.post(
            URL, headers=auth_headers,
            data=_audio(), content_type="multipart/form-data",
        )

    assert resp.status_code == 200
    assert captured["exists_during"] is True          # présent pendant la transcription
    assert not os.path.exists(captured["path"])        # supprimé dans le finally


def test_path_traversal_filename_is_sanitized(client, auth_headers, rag_module):
    captured = {}

    class FakeTranscriber:
        def transcribe(self, path):
            captured["path"] = path
            return "q"

    with patch.object(rag_module, "TranscriptionService", return_value=FakeTranscriber()), \
         patch.object(rag_module, "RagService") as MR:
        MR.return_value.ask.return_value = _rag_result()
        resp = client.post(
            URL, headers=auth_headers,
            data={"audio": (io.BytesIO(b"x"), "../../etc/passwd")},
            content_type="multipart/form-data",
        )

    assert resp.status_code == 200
    # le ../ est neutralisé : fichier strictement sous temp_audio/
    assert os.path.basename(captured["path"]) == "etc_passwd"
    assert os.path.dirname(captured["path"]).endswith("temp_audio")
