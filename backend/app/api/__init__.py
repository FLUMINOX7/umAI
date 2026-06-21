from flask import Blueprint

from .auth import auth_bp
from .conversations import conversations_bp
from .health import health_bp
from .llm import llm_bp
from .rag import rag_bp
from .messages import messages_bp


api_bp = Blueprint("api", __name__)

api_bp.register_blueprint(health_bp)
api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(conversations_bp)
api_bp.register_blueprint(messages_bp)
api_bp.register_blueprint(llm_bp)
api_bp.register_blueprint(rag_bp)
