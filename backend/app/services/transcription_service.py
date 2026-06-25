import os
import shutil
import threading

import whisper

if not shutil.which("ffmpeg"):
    default_windows_ffmpeg = r"C:\ffmpeg\bin"
    if os.path.exists(default_windows_ffmpeg) and default_windows_ffmpeg not in os.environ["PATH"]:
        os.environ["PATH"] += os.pathsep + default_windows_ffmpeg


class TranscriptionService:
    """Charge le modèle Whisper une seule fois et le partage entre les requêtes.

    Le modèle n'est mis en cache qu'après un chargement *réussi* : si
    ``whisper.load_model`` échoue (téléchargement, droits d'écriture sur le cache,
    mémoire insuffisante…), la vraie erreur est propagée et le prochain appel
    réessaie — au lieu de garder une instance à moitié initialisée qui renvoyait
    « object has no attribute 'model' ».
    """

    _model = None
    _lock = threading.Lock()

    def __init__(self, model_name: str = "base"):
        self._model_name = model_name

    @property
    def model(self):
        if TranscriptionService._model is None:
            with TranscriptionService._lock:
                if TranscriptionService._model is None:
                    TranscriptionService._model = whisper.load_model(self._model_name)
        return TranscriptionService._model

    def transcribe(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        result = self.model.transcribe(file_path, fp16=False)
        return result.get("text", "").strip()