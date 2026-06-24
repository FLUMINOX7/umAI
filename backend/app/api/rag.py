from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from rag.service import RagService, RagServiceError

from app.services.transcription_service import TranscriptionService


rag_bp = Blueprint("rag", __name__, url_prefix="/rag")


def _extract_payload():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


@rag_bp.get("/status")
@jwt_required()
def rag_status():
    service = RagService()
    return jsonify(
        {
            "ready": service.is_ready(),
            "docs_dir": str(service.config.docs_dir),
            "vector_store_dir": str(service.config.vector_store_dir),
        }
    )


@rag_bp.post("/ingest")
@jwt_required()
def rag_ingest():
    _ = get_jwt_identity()
    service = RagService()
    try:
        result = service.ingest()
    except RagServiceError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(
        {
            "message": "RAG index rebuilt successfully",
            "processed_files": result.processed_files,
            "stored_documents": result.stored_documents,
            "stored_chunks": result.stored_chunks,
            "vector_store_dir": str(result.vector_store_dir),
        }
    ), 201


@rag_bp.post("/query")
@jwt_required()
def rag_query():
    _ = get_jwt_identity()
    payload = _extract_payload()
    question = (payload.get("question") or payload.get("content") or "").strip()
    if not question:
        return jsonify({"error": "question is required"}), 400

    conversation_history = payload.get("conversation_history")
    if not isinstance(conversation_history, list):
        conversation_history = None

    top_k = payload.get("top_k")
    model = payload.get("model")

    service = RagService()
    try:
        result = service.ask(
            question=question,
            conversation_history=conversation_history,
            top_k=top_k if isinstance(top_k, int) else None,
            model=model if isinstance(model, str) else None,
        )
    except RagServiceError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(
        {
            "answer": result.answer,
            "context": result.context,
            "sources": result.sources,
        }
    )

@rag_bp.post("/query/voice")
@jwt_required()
def rag_query_voice():
    _ = get_jwt_identity()
    
    if "audio" not in request.files:
        return jsonify({"error": "audio file is required"}), 400
        
    audio_file = request.files["audio"]
    if audio_file.filename == "":
        return jsonify({"error": "audio file name cannot be empty"}), 400

    temp_dir = os.path.join(os.getcwd(), "temp_audio")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, audio_file.filename)
    audio_file.save(temp_path)

    try:
        transcriber = TranscriptionService()
        question_text = transcriber.transcribe(temp_path)

        if not question_text:
            return jsonify({"error": "failed to transcribe audio"}), 400

        payload = _extract_payload()
        conversation_history = payload.get("conversation_history")
        top_k = payload.get("top_k")
        model = payload.get("model")

        service = RagService()
        result = service.ask(
            question=question_text,
            conversation_history=conversation_history,
            top_k=top_k if isinstance(top_k, int) else None,
            model=model if isinstance(model, str) else None,
        )

        return jsonify({
            "transcription": question_text,
            "answer": result.answer,
            "context": result.context,
            "sources": result.sources
        }), 200

    except RagServiceError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)