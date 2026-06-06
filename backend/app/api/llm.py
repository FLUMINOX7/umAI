from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.llm_service import generate_chat_response, LLMServiceError
from app.services import ConversationService, MessageService
from app.models import Conversation


llm_bp = Blueprint("llm", __name__, url_prefix="/llm")


def _extract_payload():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


def _get_owned_conversation(conversation_id, user_id):
    return Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()


@llm_bp.post("/sessions")
@jwt_required()
def create_session():
    user_id = get_jwt_identity()
    payload = _extract_payload()
    title = (payload.get("title") or "").strip() or None
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else None
    conv = ConversationService.create_conversation(user_id, title=title, metadata=metadata)
    return jsonify({"session": conv.to_dict()}), 201


@llm_bp.get("/sessions")
@jwt_required()
def list_sessions():
    user_id = get_jwt_identity()
    convs = ConversationService.list_user_conversations(user_id)
    return jsonify({"sessions": [c.to_dict() for c in convs]})


@llm_bp.get("/sessions/<session_id>")
@jwt_required()
def get_session(session_id):
    user_id = get_jwt_identity()
    conv = _get_owned_conversation(session_id, user_id)
    if conv is None:
        return jsonify({"error": "session not found"}), 404
    messages = MessageService.list_conversation_messages(session_id)
    return jsonify({"session": conv.to_dict(), "messages": [m.to_dict() for m in messages]})


@llm_bp.delete("/sessions/<session_id>")
@jwt_required()
def delete_session(session_id):
    user_id = get_jwt_identity()
    conv = _get_owned_conversation(session_id, user_id)
    if conv is None:
        return jsonify({"error": "session not found"}), 404
    ConversationService.delete_conversation(conv)
    return jsonify({"message": "session deleted"})


@llm_bp.post("/sessions/<session_id>/chat")
@jwt_required()
def session_chat(session_id):
    user_id = get_jwt_identity()
    conv = _get_owned_conversation(session_id, user_id)
    if conv is None:
        return jsonify({"error": "session not found"}), 404

    payload = _extract_payload()
    content = (payload.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400
    model = payload.get("model")

    user_msg = MessageService.create_message(session_id, user_id=user_id, role="user", content=content)
    history = MessageService.list_conversation_messages(session_id)
    messages = [{"role": m.role, "content": m.content} for m in history]
    use_rag = bool(payload.get("use_rag"))

    try:
        if use_rag:
            from rag.service import RagService

            rag_service = RagService()
            rag_result = rag_service.ask(
                question=content,
                conversation_history=messages,
                top_k=payload.get("top_k") if isinstance(payload.get("top_k"), int) else None,
                model=model,
            )
            reply_text = rag_result.answer
            assistant_metadata = {"rag": True, "context": rag_result.context, "sources": rag_result.sources}
        else:
            reply_text = generate_chat_response(messages, model=model)
            assistant_metadata = None
    except LLMServiceError as exc:
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    assistant_msg = MessageService.create_message(
        session_id,
        user_id=None,
        role="assistant",
        content=reply_text,
        metadata=assistant_metadata,
    )

    return jsonify({"reply": assistant_msg.to_dict(), "user_message": user_msg.to_dict()})