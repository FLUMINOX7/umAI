import json
import os
from typing import Dict, List, Optional


def _get_llm_api_key() -> Optional[str]:
    return os.getenv("LLM_API_KEY")


def _get_openrouter_url() -> str:
    return os.getenv("LLM_URL") or "https://openrouter.ai/api/v1/chat/completions"
MODELS = [
    "deepseek/deepseek-v4-flash:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/free",
]


class LLMServiceError(Exception):
    pass


def _post_json(url: str, payload: Dict[str, object], headers: Optional[Dict[str, str]] = None) -> Dict[str, object]:
    merged_headers = headers or {}

    try:
        import requests
        try:
            response = requests.post(url, json=payload, headers=merged_headers, timeout=30)
        except Exception as exc:
            raise LLMServiceError(str(exc)) from exc

        if not response.ok:
            raise LLMServiceError(f"{url} error {response.status_code}: {response.text}")

        try:
            return response.json()
        except Exception as exc:
            raise LLMServiceError(f"invalid JSON response from {url}: {response.text}") from exc
    except Exception:
        # Fallback to stdlib so the service still works without requests installed.
        from urllib import request, error

        raw_payload = json.dumps(payload).encode("utf-8")
        req = request.Request(url, data=raw_payload, headers=merged_headers, method="POST")
        try:
            with request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
                status = resp.status
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            raise LLMServiceError(f"{url} error {exc.code}: {body}") from exc
        except Exception as exc:
            raise LLMServiceError(str(exc)) from exc

        try:
            return json.loads(body)
        except Exception as exc:
            raise LLMServiceError(f"invalid JSON response from {url}: {body}") from exc


def _extract_openrouter_text(data: Dict[str, object]) -> Optional[str]:
    try:
        content = data["choices"][0]["message"]["content"]
    except Exception:
        content = data.get("text")
    if isinstance(content, str) and content.strip():
        return content
    return None


def _call_openrouter(messages: List[Dict[str, str]], model: str, stream: bool = False) -> str:
    """Call OpenRouter's chat completions endpoint and return text."""
    api_key = _get_llm_api_key()
    if not api_key:
        raise LLMServiceError("LLM_API_KEY is not set; set it in your .env to call OpenRouter")

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "messages": messages, "stream": stream}
    data = _post_json(_get_openrouter_url(), payload, headers=headers)
    text = _extract_openrouter_text(data)
    if text is None:
        # Réponse 200 mais sans contenu exploitable : on évite d'enregistrer un
        # message vide et on remonte la réponse brute pour diagnostiquer.
        raise LLMServiceError(f"model {model} returned no text content: {data}")
    return text


def generate_chat_response(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    stream: bool = False,
) -> str:
    """Generate a chat response via ordered OpenRouter model fallbacks."""
    candidate_models: List[str] = []
    if model:
        candidate_models.append(model)
    candidate_models.extend(MODELS)
    # Keep model order while dropping duplicates.
    deduped_models = list(dict.fromkeys(candidate_models))

    errors: List[str] = []
    for candidate in deduped_models:
        try:
            return _call_openrouter(messages, model=candidate, stream=stream)
        except LLMServiceError as exc:
            errors.append(f"{candidate}: {exc}")

    raise LLMServiceError("All configured OpenRouter models failed: " + " | ".join(errors))
