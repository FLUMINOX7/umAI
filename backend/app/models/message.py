from datetime import datetime, timezone

from app.extensions import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Uuid, primary_key=True, server_default=db.text("uuid_generate_v4()"))
    conversation_id = db.Column(db.Uuid, db.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Uuid, db.ForeignKey("users.id", ondelete="SET NULL"))
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    metadata_ = db.Column("metadata", db.JSON)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "conversation_id": str(self.conversation_id),
            "user_id": str(self.user_id) if self.user_id else None,
            "role": self.role,
            "content": self.content,
            "metadata": self.metadata_,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }