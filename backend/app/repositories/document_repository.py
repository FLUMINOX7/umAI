from app.extensions import db
from app.models.document import Document, DocChunk


class DocumentRepository:
    @staticmethod
    def list_all():
        return Document.query.order_by(Document.source.asc()).all()

    @staticmethod
    def get_by_id(document_id):
        return Document.query.get(document_id)

    @staticmethod
    def create(source: str, content: str):
        doc = Document(source=source, content=content)
        db.session.add(doc)
        db.session.commit()
        return doc

    @staticmethod
    def create_chunk(document_id: str, content: str):
        chunk = DocChunk(document_id=document_id, content=content)
        db.session.add(chunk)
        db.session.commit()
        return chunk
