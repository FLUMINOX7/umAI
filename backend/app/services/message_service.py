from app.repositories import MessageRepository


class MessageService:
    @staticmethod
    def list_conversation_messages(conversation_id):
        return MessageRepository.list_by_conversation(conversation_id)

    @staticmethod
    def create_message(conversation_id, user_id=None, role="user", content="", metadata=None):
        return MessageRepository.create(
            conversation_id,
            user_id=user_id,
            role=role,
            content=content,
            metadata=metadata,
        )

    @staticmethod
    def update_message(message, role=None, content=None, metadata=None):
        return MessageRepository.update(message, role=role, content=content, metadata=metadata)

    @staticmethod
    def delete_message(message):
        MessageRepository.delete(message)
