from datetime import datetime, timezone

from app.extensions import db
from app.models import Message


class MessageRepository:
    @staticmethod
    def list_by_conversation(conversation_id):
        return Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()

    @staticmethod
    def get_by_id(message_id):
        return Message.query.get(message_id)

    @staticmethod
    def create(conversation_id, user_id=None, role="user", content="", metadata=None):
        message = Message(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
            content=content,
            metadata_=metadata,
        )
        db.session.add(message)
        db.session.commit()
        return message

    @staticmethod
    def update(message, role=None, content=None, metadata=None):
        if role is not None:
            message.role = role
        if content is not None:
            message.content = content
        if metadata is not None:
            message.metadata_ = metadata
        db.session.commit()
        return message

    @staticmethod
    def delete(message):
        db.session.delete(message)
        db.session.commit()
