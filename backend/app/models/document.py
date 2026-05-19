from app.extensions import db

class Document(db.Model):
    __tablename__ = "documents"
    __bind_key__ = "docs"   # DATABASE_DOCS_URL
    id = db.Column(db.String, primary_key=True, nullable=False, unique=True, index=True, server_default=db.text("uuid_generate_v4()"))
    source = db.Column(db.String, nullable=False)
    content = db.Column(db.Text, nullable=False)

class DocChunk(db.Model):
    __tablename__ = "doc_chunks"
    __bind_key__ = "docs"   # DATABASE_DOCS_URL
    id = db.Column(db.String, primary_key=True, nullable=False, unique=True, index=True, server_default=db.text("uuid_generate_v4()"))
    document_id = db.Column(db.String, db.ForeignKey("documents.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    document = db.relationship("Document", backref=db.backref("chunks", lazy=True))