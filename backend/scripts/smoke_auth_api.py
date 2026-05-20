#!/usr/bin/env python3
"""Smoke test for auth endpoints against PostgreSQL.

This script:
- creates a fake account via the API,
- logs in with that account,
- fetches the profile,
- updates the account,
- prints the row from PostgreSQL so you can see it in the DB,
- keeps the account in the database for inspection.
"""

from __future__ import annotations

import os
import sys
import time

from dotenv import load_dotenv
from sqlalchemy import text


project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

load_dotenv(os.path.join(project_root, ".env"))

from app import create_app
from app.extensions import db
from app.models import User


def main() -> int:
    app = create_app()
    client = app.test_client()

    suffix = int(time.time())
    username = f"fake_user_{suffix}"
    email = f"{username}@example.com"
    password = "TestPass123!"

    register_response = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    print("register status:", register_response.status_code)
    print(register_response.get_json())
    if register_response.status_code != 201:
        return 1

    token = register_response.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    login_response = client.post(
        "/api/auth/login",
        json={"identifier": username, "password": password},
    )
    print("login status:", login_response.status_code)
    print(login_response.get_json())
    if login_response.status_code != 200:
        return 1

    me_response = client.get("/api/auth/me", headers=headers)
    print("me status:", me_response.status_code)
    print(me_response.get_json())
    if me_response.status_code != 200:
        return 1

    update_response = client.patch(
        "/api/auth/me",
        headers=headers,
        json={"username": f"{username}_updated"},
    )
    print("update status:", update_response.status_code)
    print(update_response.get_json())
    if update_response.status_code != 200:
        return 1

    transient_suffix = suffix + 1
    transient_username = f"temp_delete_{transient_suffix}"
    transient_email = f"{transient_username}@example.com"

    transient_register = client.post(
        "/api/auth/register",
        json={"username": transient_username, "email": transient_email, "password": password},
    )
    print("transient register status:", transient_register.status_code)
    print(transient_register.get_json())
    if transient_register.status_code != 201:
        return 1

    transient_headers = {"Authorization": f"Bearer {transient_register.get_json()['access_token']}"}
    delete_response = client.delete("/api/auth/me", headers=transient_headers)
    print("delete status:", delete_response.status_code)
    print(delete_response.get_json())
    if delete_response.status_code != 200:
        return 1

    with app.app_context():
        row = db.session.execute(
            text(
                """
                SELECT id, username, email, is_active, created_at, last_login
                FROM users
                WHERE email = :email
                """
            ),
            {"email": email},
        ).mappings().first()

        print("database row:")
        print(dict(row) if row else None)

        model_user = User.query.filter_by(email=email).first()
        print("orm row:")
        print(model_user.to_dict() if model_user else None)

    print("OK: fake account kept in PostgreSQL for inspection")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
