from __future__ import annotations

from langchain_community.embeddings import HuggingFaceEmbeddings


def build_embeddings(model_name: str) -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=model_name)