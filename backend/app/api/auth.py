from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.models import User


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def _extract_payload() -> dict:
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


def _user_response(user: User):
    return jsonify({"user": user.to_dict()})


@auth_bp.post("/register")
def register():
    payload = _extract_payload()
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip() or None
    password = payload.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"error": "username already exists"}), 409

    if email and User.query.filter_by(email=email).first() is not None:
        return jsonify({"error": "email already exists"}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    payload = _extract_payload()
    identifier = (payload.get("identifier") or payload.get("username") or payload.get("email") or "").strip()
    password = payload.get("password") or ""

    if not identifier or not password:
        return jsonify({"error": "identifier and password are required"}), 400

    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "invalid credentials"}), 401

    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"error": "user not found"}), 404

    return _user_response(user)


@auth_bp.patch("/me")
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"error": "user not found"}), 404

    payload = _extract_payload()
    username = payload.get("username")
    email = payload.get("email")

    if username is not None:
        username = username.strip()
        if not username:
            return jsonify({"error": "username cannot be empty"}), 400
        existing = User.query.filter(User.username == username, User.id != user.id).first()
        if existing is not None:
            return jsonify({"error": "username already exists"}), 409
        user.username = username

    if email is not None:
        email = email.strip() or None
        if email:
            existing = User.query.filter(User.email == email, User.id != user.id).first()
            if existing is not None:
                return jsonify({"error": "email already exists"}), 409
        user.email = email

    if payload.get("password"):
        user.set_password(payload["password"])

    db.session.commit()
    return _user_response(user)


@auth_bp.delete("/me")
@jwt_required()
def delete_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"error": "user not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "account deleted"}), 200