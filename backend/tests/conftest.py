"""Fixtures de test pour la route vocale du RAG.

La route ``app/api/rag.py`` est chargée *en isolation* : on remplace dans
``sys.modules`` les dépendances lourdes (Whisper / torch via
``app.services.transcription_service``, et le moteur RAG via ``rag.service``)
par des stubs légers. On peut ainsi tester la logique HTTP de la route
(gestion du fichier, parsing des paramètres de formulaire, codes d'erreur, JWT)
sans installer les ~180 paquets ML ni démarrer la base de données.
"""

import importlib.util
import sys
import types
from pathlib import Path

import pytest
from flask import Blueprint, Flask
from flask_jwt_extended import JWTManager, create_access_token

BACKEND_DIR = Path(__file__).resolve().parent.parent
RAG_PATH = BACKEND_DIR / "app" / "api" / "rag.py"


def _install_stub_modules():
    """Place des modules factices dans sys.modules pour les imports de rag.py."""

    # --- rag.service : RagService + RagServiceError ---
    rag_pkg = types.ModuleType("rag")
    rag_pkg.__path__ = []  # marque le module comme un package
    rag_service = types.ModuleType("rag.service")

    class RagServiceError(Exception):
        pass

    class RagService:  # remplacé par un mock dans chaque test
        def ask(self, **kwargs):  # pragma: no cover - défaut jamais utilisé
            raise NotImplementedError

    rag_service.RagService = RagService
    rag_service.RagServiceError = RagServiceError
    rag_pkg.service = rag_service
    sys.modules["rag"] = rag_pkg
    sys.modules["rag.service"] = rag_service

    # --- app.services.transcription_service : TranscriptionService ---
    app_pkg = types.ModuleType("app")
    app_pkg.__path__ = []
    services_pkg = types.ModuleType("app.services")
    services_pkg.__path__ = []
    transcription = types.ModuleType("app.services.transcription_service")

    class TranscriptionService:  # remplacé par un mock dans chaque test
        def transcribe(self, file_path):  # pragma: no cover - défaut jamais utilisé
            raise NotImplementedError

    transcription.TranscriptionService = TranscriptionService
    services_pkg.transcription_service = transcription
    app_pkg.services = services_pkg
    sys.modules["app"] = app_pkg
    sys.modules["app.services"] = services_pkg
    sys.modules["app.services.transcription_service"] = transcription


def _load_rag_module():
    spec = importlib.util.spec_from_file_location("rag_api_under_test", RAG_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules["rag_api_under_test"] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="session")
def rag_module():
    _install_stub_modules()
    return _load_rag_module()


@pytest.fixture
def app(rag_module):
    flask_app = Flask(__name__)
    flask_app.config["TESTING"] = True
    flask_app.config["JWT_SECRET_KEY"] = "test-secret"
    JWTManager(flask_app)
    # On reproduit la structure réelle : rag_bp (prefixe /rag) est imbrique
    # dans api_bp (prefixe /api) -> route finale /api/rag/query/voice.
    api_bp = Blueprint("api", __name__)
    api_bp.register_blueprint(rag_module.rag_bp)
    flask_app.register_blueprint(api_bp, url_prefix="/api")
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(app):
    with app.app_context():
        token = create_access_token(identity="test-user")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _isolate_cwd(tmp_path, monkeypatch):
    """La route crée ``temp_audio/`` dans le cwd : on l'isole dans un tmp."""
    monkeypatch.chdir(tmp_path)
