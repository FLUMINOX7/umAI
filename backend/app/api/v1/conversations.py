from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Conversation
from app.services import ConversationService


conversations_bp = Blueprint("conversations", __name__, url_prefix="/conversations")


def _extract_payload():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


@conversations_bp.get("")
@jwt_required()
def list_conversations():
    user_id = get_jwt_identity()
    conversations = ConversationService.list_user_conversations(user_id)
    return jsonify({"conversations": [conversation.to_dict() for conversation in conversations]})


@conversations_bp.post("")
@jwt_required()
def create_conversation():
    user_id = get_jwt_identity()
    payload = _extract_payload()
    title = (payload.get("title") or "").strip() or None
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else None
    conversation = ConversationService.create_conversation(user_id, title=title, metadata=metadata)
    return jsonify({"conversation": conversation.to_dict()}), 201


@conversations_bp.get("/<conversation_id>")
@jwt_required()
def get_conversation(conversation_id):
    user_id = get_jwt_identity()
    target = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if target is None:
        return jsonify({"error": "conversation not found"}), 404
    return jsonify({"conversation": target.to_dict()})


@conversations_bp.patch("/<conversation_id>")
@jwt_required()
def update_conversation(conversation_id):
    user_id = get_jwt_identity()
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if conversation is None:
        return jsonify({"error": "conversation not found"}), 404

    payload = _extract_payload()
    title = payload.get("title")
    if title is not None:
        title = title.strip() or None
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else None
    updated = ConversationService.update_conversation(conversation, title=title, metadata=metadata)
    return jsonify({"conversation": updated.to_dict()})


@conversations_bp.delete("/<conversation_id>")
@jwt_required()
def delete_conversation(conversation_id):
    user_id = get_jwt_identity()
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if conversation is None:
        return jsonify({"error": "conversation not found"}), 404

    ConversationService.delete_conversation(conversation)
    return jsonify({"message": "conversation deleted"})