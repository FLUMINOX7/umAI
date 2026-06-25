from __future__ import annotations

import argparse
import shutil
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _ensure_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _copy_if_missing(source: Path, target: Path) -> bool:
    if target.exists():
        return False
    shutil.copyfile(source, target)
    return True


def bootstrap(no_env_copy: bool = False) -> None:
    pdf_dir = BACKEND_ROOT / "cuisine_pdf"
    instance_rag_dir = BACKEND_ROOT / "instance" / "rag" / "faiss_index"
    env_file = BACKEND_ROOT / ".env"
    env_example = BACKEND_ROOT / ".env.example"

    _ensure_directory(pdf_dir)
    _ensure_directory(instance_rag_dir)

    if not no_env_copy and env_example.exists():
        if _copy_if_missing(env_example, env_file):
            print(f"Created {env_file} from .env.example")

    print(f"Ready folder: {pdf_dir}")
    print(f"Ready folder: {instance_rag_dir}")
    print("Next step: fill .env, then run the API or POST /api/rag/ingest after placing the PDFs.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap local backend folders and environment files")
    parser.add_argument("--no-env-copy", action="store_true", help="Do not copy .env.example to .env when missing")
    args = parser.parse_args()

    bootstrap(no_env_copy=args.no_env_copy)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())