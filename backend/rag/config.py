from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _resolve_path(raw_value: str | None, default_path: Path, base_dir: Path) -> Path:
    path = Path(raw_value).expanduser() if raw_value else default_path
    if not path.is_absolute():
        path = (base_dir / path).resolve()
    return path


def _read_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None or raw_value.strip() == "":
        return default
    try:
        return int(raw_value)
    except ValueError:
        return default


@dataclass(frozen=True)
class RagConfig:
    docs_dir: Path
    vector_store_dir: Path
    embedding_model_name: str
    chunk_size: int
    chunk_overlap: int
    top_k: int

    @classmethod
    def from_env(cls) -> "RagConfig":
        backend_root = Path(__file__).resolve().parents[1]

        docs_dir = _resolve_path(
            os.getenv("RAG_DOCS_DIR"),
            backend_root / "cuisine_pdf",
            backend_root,
        )
        vector_store_dir = _resolve_path(
            os.getenv("RAG_VECTOR_STORE_DIR"),
            backend_root / "instance" / "rag" / "faiss_index",
            backend_root,
        )

        return cls(
            docs_dir=docs_dir,
            vector_store_dir=vector_store_dir,
            embedding_model_name=os.getenv(
                "RAG_EMBEDDING_MODEL",
                "sentence-transformers/all-MiniLM-L6-v2",
            ),
            chunk_size=_read_int("RAG_CHUNK_SIZE", 512),
            chunk_overlap=_read_int("RAG_CHUNK_OVERLAP", 50),
            top_k=_read_int("RAG_TOP_K", 4),
        )