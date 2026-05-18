#!/usr/bin/env python3
"""Smoke test for the classic backend API: auth + conversations.

The script creates a temporary user, exercises auth endpoints, creates and
updates conversations, and leaves one account plus one conversation in Postgres
for inspection.
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
from app.models import Conversation, User


def main() -> int:
    app = create_app()
    client = app.test_client()

    suffix = int(time.time())
    username = f"api_user_{suffix}"
    email = f"{username}@example.com"
    password = "TestPass123!"

    register = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    print("register:", register.status_code)
    print(register.get_json())
    if register.status_code != 201:
        return 1

    token = register.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    login = client.post(
        "/api/v1/auth/login",
        json={"identifier": username, "password": password},
    )
    print("login:", login.status_code)
    print(login.get_json())
    if login.status_code != 200:
        return 1

    me = client.get("/api/v1/auth/me", headers=headers)
    print("me:", me.status_code)
    print(me.get_json())
    if me.status_code != 200:
        return 1

    update_me = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"username": f"{username}_updated"},
    )
    print("update_me:", update_me.status_code)
    print(update_me.get_json())
    if update_me.status_code != 200:
        return 1

    conversation = client.post(
        "/api/v1/conversations",
        headers=headers,
        json={"title": "Conversation de test"},
    )
    print("conversation create:", conversation.status_code)
    print(conversation.get_json())
    if conversation.status_code != 201:
        return 1

    conversation_id = conversation.get_json()["conversation"]["id"]

    list_resp = client.get("/api/v1/conversations", headers=headers)
    print("conversation list:", list_resp.status_code)
    print(list_resp.get_json())
    if list_resp.status_code != 200:
        return 1

    get_resp = client.get(f"/api/v1/conversations/{conversation_id}", headers=headers)
    print("conversation get:", get_resp.status_code)
    print(get_resp.get_json())
    if get_resp.status_code != 200:
        return 1

    update_conv = client.patch(
        f"/api/v1/conversations/{conversation_id}",
        headers=headers,
        json={"title": "Conversation modifiée"},
    )
    print("conversation update:", update_conv.status_code)
    print(update_conv.get_json())
    if update_conv.status_code != 200:
        return 1

    transient = client.post(
        "/api/v1/conversations",
        headers=headers,
        json={"title": "Temporaire"},
    )
    if transient.status_code != 201:
        return 1
    transient_id = transient.get_json()["conversation"]["id"]
    delete_resp = client.delete(f"/api/v1/conversations/{transient_id}", headers=headers)
    print("conversation delete:", delete_resp.status_code)
    print(delete_resp.get_json())
    if delete_resp.status_code != 200:
        return 1

    with app.app_context():
        user_row = db.session.execute(
            text(
                """
                SELECT id, username, email, is_active, created_at, last_login
                FROM users
                WHERE email = :email
                """
            ),
            {"email": email},
        ).mappings().first()
        print("user row:")
        print(dict(user_row) if user_row else None)

        conv_row = db.session.execute(
            text(
                """
                SELECT id, user_id, title, created_at, updated_at
                FROM conversations
                WHERE id = :conversation_id
                """
            ),
            {"conversation_id": conversation_id},
        ).mappings().first()
        print("conversation row:")
        print(dict(conv_row) if conv_row else None)

        orm_user = User.query.filter_by(email=email).first()
        orm_conv = db.session.get(Conversation, conversation_id)
        print("orm user:")
        print(orm_user.to_dict() if orm_user else None)
        print("orm conversation:")
        print(orm_conv.to_dict() if orm_conv else None)

    print("OK: account and conversation created and verified in PostgreSQL")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
