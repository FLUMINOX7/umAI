from __future__ import annotations

from pathlib import Path

try:
    from langchain_community.document_loaders import PyPDFLoader
except Exception:
    from langchain.document_loaders import PyPDFLoader


def list_pdf_files(docs_dir: str | Path) -> list[Path]:
    base_path = Path(docs_dir)
    if not base_path.exists():
        return []
    return sorted(path for path in base_path.rglob("*.pdf") if path.is_file())


def load_pdf_documents(docs_dir: str | Path):
    base_path = Path(docs_dir)
    documents = []
    for pdf_path in list_pdf_files(docs_dir):
        loader = PyPDFLoader(str(pdf_path))
        pdf_documents = loader.load()
        try:
            source_id = str(pdf_path.relative_to(base_path))
        except ValueError:
            source_id = pdf_path.name
        for document in pdf_documents:
            document.metadata["source_file"] = pdf_path.name
            document.metadata["source_id"] = source_id
            document.metadata["source_path"] = str(pdf_path)
        documents.extend(pdf_documents)
    return documents