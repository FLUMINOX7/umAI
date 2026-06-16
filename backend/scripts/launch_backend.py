from __future__ import annotations

import argparse
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from scripts.bootstrap_backend import bootstrap


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap local files and launch the backend server")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host for the Flask dev server")
    parser.add_argument("--port", type=int, default=5000, help="Bind port for the Flask dev server")
    parser.add_argument("--no-env-copy", action="store_true", help="Do not copy .env.example to .env when missing")
    parser.add_argument("--no-debug", action="store_true", help="Disable Flask debug mode")
    args = parser.parse_args()

    bootstrap(no_env_copy=args.no_env_copy)

    print("\nManual step reminder:")
    print("- create the PostgreSQL database if it does not exist yet")
    print("- apply backend/database/schema.sql to the main database")
    print("- place the cuisine PDFs in backend/cuisine_pdf/")
    print("- if needed, run POST /api/rag/ingest after launch")

    from app import create_app

    app = create_app()
    app.run(host=args.host, port=args.port, debug=not args.no_debug)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())