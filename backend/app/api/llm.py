from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.llm_service import generate_chat_response, LLMServiceError
from app.services import ConversationService, MessageService
from app.models import Conversation
from app.web_search_service import WebSearchService, WebSearchServiceError


llm_bp = Blueprint("llm", __name__, url_prefix="/llm")

_ALLOWED_RETRIEVAL_MODES = {"none", "rag", "web"}


def _extract_payload():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


def _get_owned_conversation(conversation_id, user_id):
    return Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()


def _build_prompt_history(messages, current_content):
    if messages and messages[-1]["role"] == "user" and messages[-1]["content"] == current_content:
        return messages[:-1]
    return messages


def _resolve_retrieval_mode(payload):
    retrieval_mode = payload.get("retrieval_mode")
    if isinstance(retrieval_mode, str) and retrieval_mode.strip():
        mode = retrieval_mode.strip().lower()
        if mode not in _ALLOWED_RETRIEVAL_MODES:
            raise ValueError("retrieval_mode must be one of: none, rag, web")
        return mode

    if payload.get("use_web_search"):
        return "web"
    if payload.get("use_rag"):
        return "rag"
    return "none"


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
    try:
        retrieval_mode = _resolve_retrieval_mode(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    user_msg = MessageService.create_message(session_id, user_id=user_id, role="user", content=content)
    history = MessageService.list_conversation_messages(session_id)
    messages = [{"role": m.role, "content": m.content} for m in history]
    prompt_history = _build_prompt_history(messages, content)

    try:
        if retrieval_mode == "rag":
            from rag.service import RagService, RagServiceError
            from rag.vector_store import RagVectorStoreError

            rag_service = RagService()
            try:
                rag_result = rag_service.ask(
                    question=content,
                    conversation_history=prompt_history,
                    top_k=payload.get("top_k") if isinstance(payload.get("top_k"), int) else None,
                    model=model,
                )
            except (RagServiceError, RagVectorStoreError) as exc:
                # Index FAISS absent / corpus non ingéré : ce n'est pas une erreur
                # serveur, on guide l'utilisateur vers l'ingestion.
                current_app.logger.warning("RAG not ready on chat: %s", exc)
                return jsonify({
                    "error": str(exc),
                    "hint": "Lance d'abord l'ingestion RAG (POST /api/rag/ingest).",
                }), 409
            reply_text = rag_result.answer
            assistant_metadata = {"rag": True, "context": rag_result.context, "sources": rag_result.sources}
        elif retrieval_mode == "web":
            web_search_service = WebSearchService()
            search_results = web_search_service.search(
                content,
                max_results=payload.get("top_k") if isinstance(payload.get("top_k"), int) else None,
            )
            web_messages = web_search_service.build_messages(
                question=content,
                search_results=search_results,
                conversation_history=prompt_history,
            )
            reply_text = generate_chat_response(web_messages, model=model)
            assistant_metadata = {
                "web_search": True,
                "results": [result.to_dict() for result in search_results],
            }
        else:
            reply_text = generate_chat_response(messages, model=model)
            assistant_metadata = None
    except LLMServiceError as exc:
        current_app.logger.warning("LLM error on chat (mode=%s): %s", retrieval_mode, exc)
        return jsonify({"error": str(exc)}), 502
    except WebSearchServiceError as exc:
        current_app.logger.warning("web search error on chat: %s", exc)
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:
        current_app.logger.exception("unexpected error on chat (mode=%s)", retrieval_mode)
        return jsonify({"error": str(exc)}), 500

    if not reply_text or not str(reply_text).strip():
        current_app.logger.warning("empty model response on chat (mode=%s)", retrieval_mode)
        return jsonify({"error": "the model returned an empty response"}), 502

    assistant_msg = MessageService.create_message(
        session_id,
        user_id=None,
        role="assistant",
        content=reply_text,
        metadata=assistant_metadata,
    )

    return jsonify({"reply": assistant_msg.to_dict(), "user_message": user_msg.to_dict()})