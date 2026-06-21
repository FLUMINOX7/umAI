from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

load_dotenv(BACKEND_ROOT / ".env")

from rag.chunking import split_documents
from rag.config import RagConfig
from rag.embeddings import build_embeddings
from rag.loaders import load_pdf_documents, list_pdf_files
from rag.vector_store import RagVectorStore, RagVectorStoreError
from rag.catalog import remove_document_by_source, store_document_with_chunks
from app.extensions import db

try:
    from langchain_community.document_loaders import PyPDFLoader
except Exception:
    from langchain.document_loaders import PyPDFLoader


def _load_existing_source_map():
    from app.models.document import Document

    return {document.source: document for document in Document.query.all()}


def _ensure_documents_tables(app) -> None:
    import importlib

    importlib.import_module("app.models.document")
    from app.models.document import DocChunk, Document

    engine = db.engines["docs"]
    Document.__table__.create(bind=engine, checkfirst=True)
    DocChunk.__table__.create(bind=engine, checkfirst=True)


def _source_id_for_pdf(pdf_path: Path, docs_dir: Path) -> str:
    try:
        return str(pdf_path.relative_to(docs_dir))
    except ValueError:
        return pdf_path.name


def _load_pdf_pages(pdf_path: Path):
    loader = PyPDFLoader(str(pdf_path))
    return loader.load()


def _index_documents(vector_store: RagVectorStore, documents) -> None:
    if not documents:
        return
    if vector_store.exists():
        store = vector_store.load()
        store.add_documents(documents)
        vector_store.save(store)
    else:
        vector_store.rebuild(documents)


def main() -> int:
    parser = argparse.ArgumentParser(description="Incrementally update the local RAG index from PDFs")
    parser.add_argument("--full-rebuild", action="store_true", help="Force a full rebuild from all PDFs")
    args = parser.parse_args()

    config = RagConfig.from_env()
    embeddings = build_embeddings(config.embedding_model_name)
    vector_store = RagVectorStore(config.vector_store_dir, embeddings)

    docs_dir = config.docs_dir
    pdf_files = list_pdf_files(docs_dir)
    if not pdf_files:
        print(f"No PDF files found in {docs_dir}")
        return 1

    from app import create_app

    app = create_app()
    with app.app_context():
        _ensure_documents_tables(app)
        existing_sources = _load_existing_source_map()
        changed_sources: list[str] = []
        new_documents = []
        new_pdf_paths: list[Path] = []

        if args.full_rebuild:
            print("Full rebuild requested.")
            all_loaded_documents = load_pdf_documents(docs_dir)
            documents_by_source: dict[str, list] = {}
            for document in all_loaded_documents:
                metadata = document.metadata or {}
                source_id = metadata.get("source_id") or metadata.get("source_file")
                if not source_id:
                    continue
                documents_by_source.setdefault(source_id, []).append(document)

            if not all_loaded_documents:
                print("No extractable content found in the PDFs.")
                return 1

            split_chunks = split_documents(
                all_loaded_documents,
                chunk_size=config.chunk_size,
                chunk_overlap=config.chunk_overlap,
            )

            chunks_by_source: dict[str, list] = {}
            for chunk in split_chunks:
                metadata = chunk.metadata or {}
                source_id = metadata.get("source_id") or metadata.get("source_file")
                if not source_id:
                    continue
                chunks_by_source.setdefault(source_id, []).append(chunk)

            for source_id, chunks in chunks_by_source.items():
                remove_document_by_source(source_id)
                full_text = "\n\n".join(chunk.page_content for chunk in chunks).strip()
                if not full_text:
                    continue
                store_document_with_chunks(source=source_id, content=full_text, chunks=chunks)

            vector_store.rebuild(split_chunks)
            print(f"Rebuilt the full index from {len(chunks_by_source)} PDF(s).")
            return 0

        for pdf_path in pdf_files:
            source_id = _source_id_for_pdf(pdf_path, docs_dir)
            existing_document = existing_sources.get(source_id)
            if existing_document is None:
                new_pdf_paths.append(pdf_path)
                continue

            pdf_pages = _load_pdf_pages(pdf_path)
            full_text = "\n\n".join(page.page_content for page in pdf_pages).strip()
            if existing_document.content != full_text:
                changed_sources.append(source_id)

        if changed_sources:
            print("Detected modified PDFs, rebuilding the full index to stay consistent.")
            new_documents = []
            for source_id in existing_sources.keys():
                remove_document_by_source(source_id)

            all_loaded_documents = load_pdf_documents(docs_dir)
            if not all_loaded_documents:
                print("No extractable content found in the PDFs.")
                return 1

            split_chunks = split_documents(
                all_loaded_documents,
                chunk_size=config.chunk_size,
                chunk_overlap=config.chunk_overlap,
            )

            chunks_by_source: dict[str, list] = {}
            for chunk in split_chunks:
                metadata = chunk.metadata or {}
                source_id = metadata.get("source_id") or metadata.get("source_file")
                if not source_id:
                    continue
                chunks_by_source.setdefault(source_id, []).append(chunk)

            for source_id, chunks in chunks_by_source.items():
                full_text = "\n\n".join(chunk.page_content for chunk in chunks).strip()
                if not full_text:
                    continue
                store_document_with_chunks(source=source_id, content=full_text, chunks=chunks)

            vector_store.rebuild(split_chunks)
            print(f"Rebuilt the full index from {len(chunks_by_source)} PDF(s).")
            return 0

        if not new_pdf_paths:
            print("No new PDFs to index.")
            return 0

        for pdf_path in new_pdf_paths:
            new_documents.extend(_load_pdf_pages(pdf_path))

        split_chunks = split_documents(
            new_documents,
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
        )

        chunks_by_source: dict[str, list] = {}
        for chunk in split_chunks:
            metadata = chunk.metadata or {}
            source_id = metadata.get("source_id") or metadata.get("source_file")
            if not source_id:
                continue
            chunks_by_source.setdefault(source_id, []).append(chunk)

        for source_id, chunks in chunks_by_source.items():
            full_text = "\n\n".join(chunk.page_content for chunk in chunks).strip()
            if not full_text:
                continue
            store_document_with_chunks(source=source_id, content=full_text, chunks=chunks)

        _index_documents(vector_store, split_chunks)
        print(f"Indexed {len(chunks_by_source)} new PDF(s) and updated the FAISS store.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())