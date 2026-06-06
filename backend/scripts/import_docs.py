import os
from pathlib import Path

try:
    from langchain_community.document_loaders import PyPDFLoader
except Exception:
    from langchain.document_loaders import PyPDFLoader

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except Exception:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

from app import create_app
from app.repositories.document_repository import DocumentRepository


def import_pdfs(docs_dir: str | Path, chunk_size: int = 512, chunk_overlap: int = 50):
    docs_dir = Path(docs_dir)
    app = create_app()
    with app.app_context():
        pdf_files = sorted([p for p in docs_dir.glob("**/*.pdf")])
        print(f"Found {len(pdf_files)} PDF(s) in {docs_dir}")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        for pdf in pdf_files:
            print(f"Processing {pdf}")
            loader = PyPDFLoader(str(pdf))
            pages = loader.load()
            full_text = "\n\n".join([p.page_content for p in pages])

            doc = DocumentRepository.create(source=str(pdf.relative_to(docs_dir)), content=full_text)

            # split into chunks (returns list of LangChain Document objects)
            chunks = splitter.split_documents(pages)
            for ch in chunks:
                DocumentRepository.create_chunk(document_id=doc.id, content=ch.page_content)

            print(f"Imported {len(chunks)} chunks for {pdf.name}")


if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parents[1]
    docs_path = os.getenv("DOCS_PATH") or repo_root / "docs"
    import_pdfs(docs_path)
