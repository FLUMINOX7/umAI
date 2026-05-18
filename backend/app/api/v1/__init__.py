from flask import Blueprint

from .conversations import conversations_bp
from .auth import auth_bp
from .health import health_bp
from .messages import messages_bp


api_v1 = Blueprint("api_v1", __name__)

api_v1.register_blueprint(health_bp)
api_v1.register_blueprint(auth_bp)
api_v1.register_blueprint(conversations_bp)
api_v1.register_blueprint(messages_bp)
