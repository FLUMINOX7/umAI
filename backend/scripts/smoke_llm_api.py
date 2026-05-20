#!/usr/bin/env python3
"""Smoke test for the LLM integration endpoint.

This test will call the `/api/llm/sessions/<id>/chat` endpoint using the Flask test
client. If no `LLM_API_KEY` is set, the service will return a deterministic
mock response so the test still passes for local development.
"""
import os
import sys
import time

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, ".env"))

from app import create_app


def main():
    app = create_app()
    client = app.test_client()
    provider = (os.environ.get("LLM_PROVIDER") or "auto").strip().lower()

    # create a temporary user via existing auth endpoint
    suffix = int(time.time())
    username = f"llm_user_{suffix}"
    email = f"{username}@example.com"
    password = "TestPass123!"

    reg = client.post("/api/auth/register", json={"username": username, "email": email, "password": password})
    print("register:", reg.status_code)
    if reg.status_code != 201:
        print(reg.get_json())
        return 1
    token = reg.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a session
    conv = client.post("/api/llm/sessions", headers=headers, json={"title": "Session test LLM"})
    print("create session:", conv.status_code)
    if conv.status_code != 201:
        print(conv.get_json())
        return 1
    session_id = conv.get_json()["session"]["id"]

    # Require an OpenRouter API key only when the smoke test is explicitly targeting OpenRouter.
    if provider == "openrouter" and not os.environ.get("LLM_API_KEY"):
        print("LLM_API_KEY not set in .env — obtain an OpenRouter API key and set LLM_API_KEY in backend/.env to run this test.")
        print("See https://openrouter.ai/ or ask me and I'll provide step-by-step.")
        return 2

    # Send a chat message in the session
    resp = client.post(
        f"/api/llm/sessions/{session_id}/chat",
        headers=headers,
        json={
            "content": "Donne-moi une recette simple de crêpes.",
            "model": os.environ.get("LLM_MODEL"),
            "provider": provider,
        },
    )
    print("session chat:", resp.status_code)
    print(resp.get_json())
    return 0 if resp.status_code == 200 else 1


if __name__ == "__main__":
    raise SystemExit(main())
