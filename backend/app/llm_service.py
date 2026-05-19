import os
from typing import List, Dict, Optional

LLM_API_KEY = os.environ.get("LLM_API_KEY")
LLM_URL = os.environ.get("LLM_URL")
LLM_MODEL = os.environ.get("LLM_MODEL", "mistralai/mistral-7b-instruct")


class LLMServiceError(Exception):
    pass


def _call_openrouter(messages: List[Dict[str, str]], model: str = LLM_MODEL, stream: bool = False) -> str:
    """Call OpenRouter's chat completions endpoint and return text.

    This function requires `LLM_API_KEY` to be set in the environment. It
    raises `LLMServiceError` on network or provider errors.
    """
    if not LLM_API_KEY:
        raise LLMServiceError("LLM_API_KEY is not set; set it in your .env to call OpenRouter")

    url = LLM_URL or "https://api.openrouter.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages}

    try:
        import requests
    except Exception:
        raise LLMServiceError("missing dependency 'requests' for OpenRouter calls; install it in your venv")

    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if not resp.ok:
        raise LLMServiceError(f"OpenRouter error {resp.status_code}: {resp.text}")
    data = resp.json()

    # OpenRouter returns a structure similar to OpenAI's: choices -> message -> content
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        # Fallback to any textual field if present
        return data.get("text") or str(data)


def generate_chat_response(messages: List[Dict[str, str]], model: Optional[str] = None, stream: bool = False) -> str:
    """Generate a chat response using OpenRouter.

    This function intentionally supports only OpenRouter to keep the
    integration simple and predictable for the project.
    """
    model = model or os.environ.get("LLM_MODEL") or LLM_MODEL
    return _call_openrouter(messages, model=model, stream=stream)
