from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

load_dotenv(BACKEND_ROOT / ".env")

from rag.prompt import format_retrieved_context
from rag.service import RagService, RagServiceError


DEFAULT_QUERY = "Je cherche une recette de dessert rapide ou de gâteau"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="RAG demo: rebuild, retrieve context, and optionally call the LLM")
    parser.add_argument("--query", default=DEFAULT_QUERY, help="Question utilisateur à tester")
    parser.add_argument("--top-k", type=int, default=None, help="Nombre de chunks à récupérer")
    parser.add_argument("--model", default=None, help="Modèle OpenRouter à forcer")
    parser.add_argument("--skip-rebuild", action="store_true", help="Ne reconstruit pas l'index FAISS")
    parser.add_argument("--skip-llm", action="store_true", help="N'appelle pas le LLM, affiche seulement le contexte")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    service = RagService()

    print(f"PDF directory: {service.config.docs_dir}")
    print(f"Vector store: {service.config.vector_store_dir}")

    if not args.skip_rebuild:
        print("Rebuilding RAG index...")
        result = service.ingest()
        print(
            f"Indexed {result.processed_files} file(s), {result.stored_documents} document(s), "
            f"and {result.stored_chunks} chunk(s)"
        )

    print(f"\nQuery: {args.query}")

    try:
        documents = service.retrieve(args.query, top_k=args.top_k)
    except Exception as exc:
        print(f"Retrieval error: {exc}")
        return 1

    context = format_retrieved_context(documents)
    print("\nRetrieved context:")
    print(context)

    print("\nRetrieved sources:")
    for index, document in enumerate(documents, start=1):
        metadata = document.metadata or {}
        source_file = metadata.get("source_id") or metadata.get("source_file") or metadata.get("source") or "unknown"
        page = metadata.get("page") + 1 if isinstance(metadata.get("page"), int) else metadata.get("page")
        print(f"[{index}] {source_file} page={page}")

    if args.skip_llm:
        print("\nLLM call skipped by flag.")
        return 0

    if not os.getenv("LLM_API_KEY", "").strip():
        print("\nLLM_API_KEY is not set, so the LLM call was skipped.")
        return 0

    try:
        answer = service.ask(
            question=args.query,
            top_k=args.top_k,
            model=args.model,
        )
    except RagServiceError as exc:
        print(f"LLM error: {exc}")
        return 1

    print("\nFinal LLM answer:")
    print(answer.answer)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())