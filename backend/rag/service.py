from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .catalog import remove_document_by_source, store_document_with_chunks
from .chunking import split_documents
from .config import RagConfig
from .embeddings import build_embeddings
from .loaders import list_pdf_files, load_pdf_documents
from .prompt import build_rag_messages, format_retrieved_context
from .vector_store import RagVectorStore, RagVectorStoreError


class RagServiceError(RuntimeError):
    pass


@dataclass(frozen=True)
class RagIngestionResult:
    processed_files: int
    stored_documents: int
    stored_chunks: int
    vector_store_dir: Path


@dataclass(frozen=True)
class RagAnswer:
    answer: str
    context: str
    sources: list[dict[str, object]]


class RagService:
    def __init__(self, config: RagConfig | None = None):
        self.config = config or RagConfig.from_env()
        self.embeddings = build_embeddings(self.config.embedding_model_name)
        self.vector_store = RagVectorStore(self.config.vector_store_dir, self.embeddings)

    def discover_sources(self) -> list[Path]:
        return list_pdf_files(self.config.docs_dir)

    def ingest(self) -> RagIngestionResult:
        pdf_files = self.discover_sources()
        if not pdf_files:
            raise RagServiceError(f"No PDF files found in {self.config.docs_dir}")

        from app import create_app

        app = create_app()
        with app.app_context():
            # Ensure the documents bind (docs) has its tables created so ingestion
            # can run without requiring the user to run DB migrations manually.
            try:
                from app.extensions import db
                # Ensure the document models are imported so SQLAlchemy knows about them
                # before calling create_all for the 'docs' bind.
                import importlib

                importlib.import_module("app.models.document")

                # Create the documents tables explicitly on the 'docs' bind so that
                # ingestion works even if migrations haven't been run.
                from app.models.document import Document, DocChunk

                engine = db.get_engine(app, bind="docs")
                Document.__table__.create(bind=engine, checkfirst=True)
                DocChunk.__table__.create(bind=engine, checkfirst=True)
            except Exception:
                # If create_all fails, proceed — repository functions will raise clearer errors.
                pass
            loaded_documents = load_pdf_documents(self.config.docs_dir)
            if not loaded_documents:
                raise RagServiceError("No page content could be extracted from the configured PDFs")

            split_chunks = split_documents(
                loaded_documents,
                chunk_size=self.config.chunk_size,
                chunk_overlap=self.config.chunk_overlap,
            )

            chunk_count = 0
            document_count = 0
            processed_sources = []

            documents_by_source: dict[str, list] = {}
            for chunk in split_chunks:
                metadata = chunk.metadata or {}
                source_id = metadata.get("source_id") or metadata.get("source_file")
                if not source_id:
                    continue
                chunk.metadata["source_file"] = metadata.get("source_file") or source_id
                chunk.metadata["source_id"] = source_id
                documents_by_source.setdefault(source_id, []).append(chunk)

            for source_id, chunks in documents_by_source.items():
                remove_document_by_source(source_id)
                full_text = "\n\n".join(chunk.page_content for chunk in chunks).strip()
                if not full_text:
                    continue

                store_document_with_chunks(source=source_id, content=full_text, chunks=chunks)
                document_count += 1
                chunk_count += len(chunks)
                processed_sources.append(source_id)

            self.vector_store.rebuild(split_chunks)

        return RagIngestionResult(
            processed_files=len(processed_sources),
            stored_documents=document_count,
            stored_chunks=chunk_count,
            vector_store_dir=self.vector_store.vector_store_dir,
        )

    def retrieve(self, question: str, top_k: int | None = None):
        vector_store = self.vector_store.load()
        return vector_store.similarity_search(question, k=top_k or self.config.top_k)

    def ask(self, question: str, conversation_history: list[dict[str, str]] | None = None, top_k: int | None = None, model: str | None = None) -> RagAnswer:
        relevant_documents = self.retrieve(question, top_k=top_k)
        context = format_retrieved_context(relevant_documents)
        messages = build_rag_messages(question, context, conversation_history=conversation_history)

        from app.llm_service import generate_chat_response

        answer = generate_chat_response(messages, model=model)
        sources = []
        for document in relevant_documents:
            metadata = document.metadata or {}
            sources.append(
                {
                    "source_file": metadata.get("source_id") or metadata.get("source_file") or metadata.get("source"),
                    "page": metadata.get("page") + 1 if isinstance(metadata.get("page"), int) else metadata.get("page"),
                    "content": document.page_content,
                }
            )

        return RagAnswer(answer=answer, context=context, sources=sources)

    def is_ready(self) -> bool:
        return self.vector_store.exists()


def build_rag_service() -> RagService:
    return RagService()