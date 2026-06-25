from __future__ import annotations

from pathlib import Path

from langchain_community.vectorstores import FAISS


class RagVectorStoreError(RuntimeError):
    pass


class RagVectorStore:
    def __init__(self, vector_store_dir: str | Path, embeddings):
        self.vector_store_dir = Path(vector_store_dir)
        self.embeddings = embeddings

    def exists(self) -> bool:
        return (
            self.vector_store_dir.exists()
            and (self.vector_store_dir / "index.faiss").exists()
            and (self.vector_store_dir / "index.pkl").exists()
        )

    def build(self, documents):
        if not documents:
            raise RagVectorStoreError("No documents available to build the vector store")
        return FAISS.from_documents(documents, self.embeddings)

    def save(self, vector_store: FAISS) -> Path:
        self.vector_store_dir.mkdir(parents=True, exist_ok=True)
        vector_store.save_local(str(self.vector_store_dir))
        return self.vector_store_dir

    def load(self) -> FAISS:
        if not self.exists():
            raise RagVectorStoreError(
                f"FAISS index not found in {self.vector_store_dir}. Run ingestion first."
            )
        return FAISS.load_local(
            str(self.vector_store_dir),
            self.embeddings,
            allow_dangerous_deserialization=True,
        )

    def rebuild(self, documents):
        vector_store = self.build(documents)
        self.save(vector_store)
        return vector_store