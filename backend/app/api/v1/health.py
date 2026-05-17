from flask import Blueprint, jsonify


health_bp = Blueprint("health", __name__, url_prefix="/health")


@health_bp.get("")
def health_check():
    return jsonify({"status": "ok"})
