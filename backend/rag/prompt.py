from __future__ import annotations


def _normalize_page_value(page_value):
    if isinstance(page_value, int):
        return page_value + 1
    return page_value


def format_retrieved_context(documents) -> str:
    if not documents:
        return "Aucun contexte pertinent n'a été retrouvé."

    context_blocks = []
    for index, document in enumerate(documents, start=1):
        metadata = document.metadata or {}
        source_file = (
            metadata.get("source_id")
            or metadata.get("source_file")
            or metadata.get("source")
            or "source inconnue"
        )
        page = _normalize_page_value(metadata.get("page"))
        location = f"{source_file}"
        if page is not None:
            location = f"{location}, page {page}"

        context_blocks.append(
            f"[{index}] {location}\n{document.page_content.strip()}"
        )

    return "\n\n".join(context_blocks)


def build_rag_messages(question: str, context: str, conversation_history=None):
    messages = [
        {
            "role": "system",
            "content": (
                "Tu es un assistant culinaire. Réponds en t'appuyant sur le contexte fourni. "
                "Si le contexte ne suffit pas, dis-le clairement au lieu d'inventer."
            ),
        },
    ]

    if conversation_history:
        messages.extend(conversation_history)

    messages.append(
        {
            "role": "system",
            "content": f"Contexte récupéré pour la question:\n\n{context}",
        }
    )
    messages.append({"role": "user", "content": question})
    return messages