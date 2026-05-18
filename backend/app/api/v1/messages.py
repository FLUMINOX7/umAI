from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Conversation
from app.services import MessageService


messages_bp = Blueprint("messages", __name__, url_prefix="/conversations/<conversation_id>/messages")

_ALLOWED_ROLES = {"user", "assistant", "system"}


def _extract_payload():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


def _get_owned_conversation(conversation_id, user_id):
    return Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()


def _get_owned_message(conversation_id, user_id, message_id):
    conversation = _get_owned_conversation(conversation_id, user_id)
    if conversation is None:
        return None, None

    message = MessageService.list_conversation_messages(conversation_id)
    target = next((item for item in message if str(item.id) == message_id), None)
    if target is None:
        return conversation, None
    return conversation, target


@messages_bp.get("")
@jwt_required()
def list_messages(conversation_id):
    user_id = get_jwt_identity()
    conversation = _get_owned_conversation(conversation_id, user_id)
    if conversation is None:
        return jsonify({"error": "conversation not found"}), 404

    messages = MessageService.list_conversation_messages(conversation_id)
    return jsonify({"messages": [message.to_dict() for message in messages]})


@messages_bp.post("")
@jwt_required()
def create_message(conversation_id):
    user_id = get_jwt_identity()
    conversation = _get_owned_conversation(conversation_id, user_id)
    if conversation is None:
        return jsonify({"error": "conversation not found"}), 404

    payload = _extract_payload()
    role = (payload.get("role") or "user").strip().lower()
    content = (payload.get("content") or "").strip()
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else None

    if role not in _ALLOWED_ROLES:
        return jsonify({"error": "invalid role"}), 400
    if not content:
        return jsonify({"error": "content is required"}), 400

    message = MessageService.create_message(
        conversation_id,
        user_id=user_id,
        role=role,
        content=content,
        metadata=metadata,
    )
    return jsonify({"message": message.to_dict()}), 201


@messages_bp.get("/<message_id>")
@jwt_required()
def get_message(conversation_id, message_id):
    user_id = get_jwt_identity()
    conversation, message = _get_owned_message(conversation_id, user_id, message_id)
    if conversation is None or message is None:
        return jsonify({"error": "message not found"}), 404
    return jsonify({"message": message.to_dict()})


@messages_bp.patch("/<message_id>")
@jwt_required()
def update_message(conversation_id, message_id):
    user_id = get_jwt_identity()
    conversation, message = _get_owned_message(conversation_id, user_id, message_id)
    if conversation is None or message is None:
        return jsonify({"error": "message not found"}), 404

    payload = _extract_payload()
    role = payload.get("role")
    if role is not None:
        role = role.strip().lower()
        if role not in _ALLOWED_ROLES:
            return jsonify({"error": "invalid role"}), 400

    content = payload.get("content")
    if content is not None:
        content = content.strip()
        if not content:
            return jsonify({"error": "content cannot be empty"}), 400

    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else None
    updated = MessageService.update_message(message, role=role, content=content, metadata=metadata)
    return jsonify({"message": updated.to_dict()})


@messages_bp.delete("/<message_id>")
@jwt_required()
def delete_message(conversation_id, message_id):
    user_id = get_jwt_identity()
    conversation, message = _get_owned_message(conversation_id, user_id, message_id)
    if conversation is None or message is None:
        return jsonify({"error": "message not found"}), 404

    MessageService.delete_message(message)
    return jsonify({"message": "message deleted"})
