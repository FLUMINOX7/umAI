from __future__ import annotations

from __future__ import annotations


class RagCatalogError(RuntimeError):
    pass


def remove_document_by_source(source: str) -> None:
    from app.extensions import db
    from app.models.document import Document

    document = Document.query.filter_by(source=source).first()
    if document is None:
        return

    for chunk in list(document.chunks):
        db.session.delete(chunk)
    db.session.delete(document)
    db.session.commit()


def store_document_with_chunks(source: str, content: str, chunks):
    from app.extensions import db
    from app.models.document import DocChunk, Document
    import uuid

    document_id = str(uuid.uuid4())
    document = Document(id=document_id, source=source, content=content)
    db.session.add(document)
    db.session.flush()

    for chunk in chunks:
        chunk_id = str(uuid.uuid4())
        db.session.add(DocChunk(id=chunk_id, document_id=document.id, content=chunk.page_content))

    db.session.commit()
    return document