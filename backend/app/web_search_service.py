from __future__ import annotations

import html
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Iterable
from urllib.parse import parse_qs, unquote, urlparse

import requests


class WebSearchServiceError(RuntimeError):
    pass


@dataclass(frozen=True)
class WebSearchResult:
    title: str
    url: str
    snippet: str | None = None

    @property
    def source(self) -> str:
        parsed_url = urlparse(self.url)
        return parsed_url.netloc or self.url

    def to_dict(self) -> dict[str, str | None]:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "source": self.source,
        }


def _normalize_duckduckgo_url(raw_url: str | None) -> str:
    if not raw_url:
        return ""

    parsed_url = urlparse(raw_url)
    query_params = parse_qs(parsed_url.query)
    if "uddg" in query_params and query_params["uddg"]:
        return unquote(query_params["uddg"][0])
    return raw_url


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


class _DuckDuckGoResultParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.results: list[WebSearchResult] = []
        self._current: dict[str, str] = {}
        self._current_capture: str | None = None
        self._capture_depth = 0
        self._buffer: list[str] = []
        self._result_depth = 0

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        class_name = attributes.get("class", "")
        classes = set(class_name.split())

        if tag == "div" and "result" in classes:
            self._result_depth = 1
            self._current = {}
            self._current_capture = None
            self._capture_depth = 0
            self._buffer = []
            return

        if self._result_depth > 0 and tag == "div":
            self._result_depth += 1

        if self._result_depth <= 0:
            return

        if tag == "a" and "result__a" in classes:
            self._current_capture = "title"
            self._capture_depth = 1
            self._buffer = []
            self._current["url"] = _normalize_duckduckgo_url(attributes.get("href"))
        elif tag in {"a", "div", "span"} and "result__snippet" in classes:
            self._current_capture = "snippet"
            self._capture_depth = 1
            self._buffer = []
        elif self._current_capture is not None:
            self._capture_depth += 1

    def handle_endtag(self, tag):
        if self._current_capture is not None:
            self._capture_depth -= 1
            if self._capture_depth <= 0:
                value = _clean_text("".join(self._buffer))
                if self._current_capture == "title":
                    self._current["title"] = value
                elif self._current_capture == "snippet":
                    self._current["snippet"] = value
                self._current_capture = None
                self._buffer = []

        if tag == "div" and self._result_depth > 0:
            self._result_depth -= 1
            if self._result_depth == 0:
                title = self._current.get("title", "").strip()
                url = self._current.get("url", "").strip()
                snippet = self._current.get("snippet", "").strip() or None
                if title and url:
                    self.results.append(WebSearchResult(title=title, url=url, snippet=snippet))
                self._current = {}
                self._current_capture = None
                self._capture_depth = 0
                self._buffer = []

    def handle_data(self, data):
        if self._current_capture is not None:
            self._buffer.append(data)


def _parse_search_results(html_text: str) -> list[WebSearchResult]:
    parser = _DuckDuckGoResultParser()
    parser.feed(html_text)
    deduped: list[WebSearchResult] = []
    seen_urls: set[str] = set()
    for result in parser.results:
        if result.url in seen_urls:
            continue
        seen_urls.add(result.url)
        deduped.append(result)
    return deduped


def format_search_context(search_results: Iterable[WebSearchResult]) -> str:
    blocks: list[str] = []
    for index, result in enumerate(search_results, start=1):
        lines = [f"[{index}] {result.title}", f"URL: {result.url}"]
        if result.snippet:
            lines.append(f"Extrait: {result.snippet}")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks) if blocks else "Aucun résultat web n'a été trouvé."


def build_web_messages(question: str, search_results: list[WebSearchResult], conversation_history=None):
    context = format_search_context(search_results)
    messages = [
        {
            "role": "system",
            "content": (
                "Tu es un assistant qui peut utiliser des résultats de recherche web. "
                "Réponds en français, reste factuel, et cite les sources avec leurs numéros entre crochets. "
                "Si les résultats ne suffisent pas, dis-le explicitement au lieu d'inventer."
            ),
        },
    ]

    if conversation_history:
        messages.extend(conversation_history)

    messages.append(
        {
            "role": "system",
            "content": f"Résultats de recherche DuckDuckGo:\n\n{context}",
        }
    )
    messages.append({"role": "user", "content": question})
    return messages


class WebSearchService:
    def __init__(self, search_url: str | None = None, timeout: int = 15):
        self.search_url = search_url or "https://html.duckduckgo.com/html/"
        self.timeout = timeout

    def search(self, query: str, max_results: int | None = None) -> list[WebSearchResult]:
        requested_results = max_results if isinstance(max_results, int) and max_results > 0 else 5
        try:
            response = requests.get(
                self.search_url,
                params={"q": query},
                timeout=self.timeout,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            response.raise_for_status()
        except Exception as exc:
            raise WebSearchServiceError(f"DuckDuckGo search failed: {exc}") from exc

        results = _parse_search_results(response.text)
        if not results:
            return []
        return results[:requested_results]

    def build_messages(self, question: str, search_results: list[WebSearchResult], conversation_history=None):
        return build_web_messages(question, search_results, conversation_history=conversation_history)