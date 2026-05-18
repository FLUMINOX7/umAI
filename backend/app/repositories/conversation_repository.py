from datetime import datetime, timezone

from app.extensions import db
from app.models import Conversation


class ConversationRepository:
    @staticmethod
    def list_by_user(user_id):
        return Conversation.query.filter_by(user_id=user_id).order_by(Conversation.updated_at.desc()).all()

    @staticmethod
    def get_by_id(conversation_id):
        return Conversation.query.get(conversation_id)

    @staticmethod
    def create(user_id, title=None, metadata=None):
        conversation = Conversation(user_id=user_id, title=title, metadata_=metadata)
        db.session.add(conversation)
        db.session.commit()
        return conversation

    @staticmethod
    def update(conversation, title=None, metadata=None):
        if title is not None:
            conversation.title = title
        if metadata is not None:
            conversation.metadata_ = metadata
        conversation.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return conversation

    @staticmethod
    def delete(conversation):
        db.session.delete(conversation)
        db.session.commit()