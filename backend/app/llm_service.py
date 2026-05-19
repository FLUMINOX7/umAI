import os
from typing import Dict, List, Optional

LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "auto").strip().lower()
LLM_API_KEY = os.environ.get("LLM_API_KEY")
LLM_OPENROUTER_URL = os.environ.get("LLM_URL") or "https://api.openrouter.ai/v1/chat/completions"
LLM_MODEL = os.environ.get("LLM_MODEL", "mistralai/mistral-7b-instruct")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1")


class LLMServiceError(Exception):
    pass


def _post_json(url: str, payload: Dict[str, object], headers: Optional[Dict[str, str]] = None) -> Dict[str, object]:
    try:
        import requests
    except Exception as exc:
        raise LLMServiceError("missing dependency 'requests' for LLM calls; install it in your venv") from exc

    try:
        response = requests.post(url, json=payload, headers=headers or {}, timeout=30)
    except Exception as exc:
        raise LLMServiceError(str(exc)) from exc

    if not response.ok:
        raise LLMServiceError(f"{url} error {response.status_code}: {response.text}")

    try:
        return response.json()
    except Exception as exc:
        raise LLMServiceError(f"invalid JSON response from {url}: {response.text}") from exc


def _extract_openrouter_text(data: Dict[str, object]) -> str:
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return str(data.get("text") or data)


def _extract_ollama_text(data: Dict[str, object]) -> str:
    message = data.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content
    response_text = data.get("response")
    if isinstance(response_text, str) and response_text.strip():
        return response_text
    return str(data)


def _call_openrouter(messages: List[Dict[str, str]], model: str = LLM_MODEL, stream: bool = False) -> str:
    """Call OpenRouter's chat completions endpoint and return text."""
    if not LLM_API_KEY:
        raise LLMServiceError("LLM_API_KEY is not set; set it in your .env to call OpenRouter")

    headers = {"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "stream": stream}
    data = _post_json(LLM_OPENROUTER_URL, payload, headers=headers)
    return _extract_openrouter_text(data)


def _call_ollama(messages: List[Dict[str, str]], model: str = OLLAMA_MODEL, stream: bool = False) -> str:
    """Call a local Ollama server and return text."""
    payload = {"model": model, "messages": messages, "stream": stream}
    data = _post_json(OLLAMA_URL, payload)
    return _extract_ollama_text(data)


def _resolve_ollama_model(model: Optional[str]) -> str:
    if isinstance(model, str) and model.startswith("ollama:"):
        return model.split(":", 1)[1]
    return OLLAMA_MODEL


def generate_chat_response(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    stream: bool = False,
    provider: Optional[str] = None,
) -> str:
    """Generate a chat response using OpenRouter or Ollama.

    Provider order:
    - explicit provider in request body
    - LLM_PROVIDER environment variable
    - automatic fallback from OpenRouter to Ollama
    """
    resolved_model = model or os.environ.get("LLM_MODEL") or LLM_MODEL
    resolved_provider = (provider or LLM_PROVIDER).strip().lower()

    if resolved_model.startswith("ollama:"):
        return _call_ollama(messages, model=resolved_model.split(":", 1)[1], stream=stream)
    if resolved_model.startswith("openrouter:"):
        return _call_openrouter(messages, model=resolved_model.split(":", 1)[1], stream=stream)

    if resolved_provider == "ollama":
        return _call_ollama(messages, model=_resolve_ollama_model(resolved_model), stream=stream)
    if resolved_provider == "openrouter":
        return _call_openrouter(messages, model=resolved_model, stream=stream)

    openrouter_error = None
    try:
        return _call_openrouter(messages, model=resolved_model, stream=stream)
    except LLMServiceError as exc:
        openrouter_error = str(exc)

    try:
        return _call_ollama(messages, model=_resolve_ollama_model(resolved_model), stream=stream)
    except LLMServiceError as exc:
        if openrouter_error:
            raise LLMServiceError(f"OpenRouter failed ({openrouter_error}); Ollama failed ({exc})") from exc
        raise
