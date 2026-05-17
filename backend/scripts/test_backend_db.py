#!/usr/bin/env python3
"""Test DB connectivity through the Flask application (SQLAlchemy).

Usage: backend/venv/bin/python backend/scripts/test_backend_db.py
"""
from dotenv import load_dotenv
import os
import sys

import sys

# ensure project root (backend/) is on sys.path so `import app` works when
# running this script from backend/scripts/
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app import create_app


def main():
    # load backend/.env
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    env_path = os.path.abspath(env_path)
    load_dotenv(env_path)

    app = create_app()

    try:
        with app.app_context():
            from app.extensions import db
            # simple query using sqlalchemy.text()
            from sqlalchemy import text
            res = db.session.execute(text('SELECT 1')).fetchone()
            if res is None:
                print('ERROR: no result from DB')
                sys.exit(2)
            print('OK: Flask app connected to DB, SELECT 1 ->', res[0])
    except Exception as e:
        print('ERROR: could not connect via Flask SQLAlchemy')
        print(e)
        sys.exit(2)


if __name__ == '__main__':
    main()
