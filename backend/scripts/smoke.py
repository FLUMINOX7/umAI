#!/usr/bin/env python3
"""Consolidated smoke test for the backend API (auth + core + optional LLM).

Usage:
  python scripts/smoke.py            # run core tests (includes auth)
  python scripts/smoke.py --llm     # also run the LLM session chat test
"""
from __future__ import annotations

import argparse
import os
import sys
import time

from dotenv import load_dotenv

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

load_dotenv(os.path.join(project_root, ".env"))

from app import create_app


def run_core_tests(client) -> int:
    suffix = int(time.time())
    username = f"smoke_user_{suffix}"
    email = f"{username}@example.com"
    password = "TestPass123!"

    reg = client.post("/api/auth/register", json={"username": username, "email": email, "password": password})
    print("register:", reg.status_code)
    if reg.status_code != 201:
        print(reg.get_json())
        return 1
    token = reg.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # basic auth/me flow
    me = client.get("/api/auth/me", headers=headers)
    print("me:", me.status_code)
    if me.status_code != 200:
        return 1

    # create a conversation
    conv = client.post("/api/conversations", headers=headers, json={"title": "Smoke conversation"})
    print("create conversation:", conv.status_code)
    if conv.status_code != 201:
        print(conv.get_json())
        return 1
    conv_id = conv.get_json()["conversation"]["id"]

    # post a message
    msg = client.post(f"/api/conversations/{conv_id}/messages", headers=headers, json={"role": "user", "content": "Salut depuis le test smoke."})
    print("create message:", msg.status_code)
    if msg.status_code != 201:
        print(msg.get_json())
        return 1

    print("Core smoke tests OK")
    return 0


def run_llm_test(client) -> int:
    # create a session via the llm endpoints (requires auth)
    suffix = int(time.time())
    username = f"llm_smoke_{suffix}"
    email = f"{username}@example.com"
    password = "TestPass123!"

    reg = client.post("/api/auth/register", json={"username": username, "email": email, "password": password})
    print("register for llm test:", reg.status_code)
    if reg.status_code != 201:
        print(reg.get_json())
        return 1
    token = reg.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    conv = client.post("/api/llm/sessions", headers=headers, json={"title": "Smoke LLM session"})
    print("create session:", conv.status_code)
    if conv.status_code != 201:
        print(conv.get_json())
        return 1
    session_id = conv.get_json()["session"]["id"]

    resp = client.post(
        f"/api/llm/sessions/{session_id}/chat",
        headers=headers,
        json={
            "content": "Donne-moi une recette simple de crêpes.",
            "model": os.environ.get("LLM_MODEL"),
        },
    )
    print("session chat:", resp.status_code)
    print(resp.get_json())
    return 0 if resp.status_code == 200 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Consolidated smoke tests for the backend API")
    parser.add_argument("--llm", action="store_true", help="also run the LLM session chat test")
    args = parser.parse_args()

    app = create_app()
    client = app.test_client()

    rc = run_core_tests(client)
    if rc != 0:
        return rc

    if args.llm:
        return run_llm_test(client)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
