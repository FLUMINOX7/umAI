from app.repositories import ConversationRepository


class ConversationService:
    @staticmethod
    def list_user_conversations(user_id):
        return ConversationRepository.list_by_user(user_id)

    @staticmethod
    def create_conversation(user_id, title=None, metadata=None):
        return ConversationRepository.create(user_id, title=title, metadata=metadata)

    @staticmethod
    def update_conversation(conversation, title=None, metadata=None):
        return ConversationRepository.update(conversation, title=title, metadata=metadata)

    @staticmethod
    def delete_conversation(conversation):
        ConversationRepository.delete(conversation)