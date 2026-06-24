import os
import shutil
import whisper

if not shutil.which("ffmpeg"):
    default_windows_ffmpeg = r"C:\ffmpeg\bin"
    if os.path.exists(default_windows_ffmpeg) and default_windows_ffmpeg not in os.environ["PATH"]:
        os.environ["PATH"] += os.pathsep + default_windows_ffmpeg


class TranscriptionService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TranscriptionService, cls).__new__(cls)
            cls._instance.model = whisper.load_model("base")
        return cls._instance

    def transcribe(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")
            
        result = self.model.transcribe(file_path, fp16=False)
        return result.get("text", "").strip()