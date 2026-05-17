from flask import Blueprint

from .auth import auth_bp
from .health import health_bp


api_v1 = Blueprint("api_v1", __name__)

api_v1.register_blueprint(health_bp)
api_v1.register_blueprint(auth_bp)
