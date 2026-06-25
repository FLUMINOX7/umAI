
# Stage 1 : builder
FROM python:3.12-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Outils de compilation nécessaires à certaines wheels (psycopg, faiss, torch...)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# venv dédié, copié tel quel dans l'image finale
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip \
    # torch CPU-only (dépendance de openai-whisper) : évite ~2,7 Go de CUDA inutile.
    # Installé avant requirements pour que whisper réutilise cette version.
    && pip install --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install -r requirements.txt \
    # serveur WSGI de production (absent de requirements.txt)
    && pip install "gunicorn>=21,<23"

# Stage 2 : runtime
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    # cache HuggingFace dans un dossier inscriptible par l'utilisateur non-root
    HF_HOME=/app/instance/hf_cache \
    # cache Whisper (modèle ~140 Mo) dans le volume persistant : téléchargé 1 seule fois
    XDG_CACHE_HOME=/app/instance/cache

# libpq pour psycopg + ffmpeg requis par Whisper pour décoder l'audio
# gosu : permet à l'entrypoint (root) de lâcher les privilèges vers appuser
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 curl ffmpeg gosu \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 appuser

# Dépendances Python depuis le builder
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

# Code applicatif
COPY . .

# Dossiers générés à l'exécution (RAG / instance) inscriptibles par appuser
RUN mkdir -p instance/rag/faiss_index cuisine_pdf \
    && chmod +x /app/entrypoint.sh \
    && chown -R appuser:appuser /app

# Pas de `USER appuser` ici : l'entrypoint démarre en root pour pouvoir corriger
# les droits du volume Railway monté sur /app/instance, puis bascule vers appuser
# via gosu.

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:5000/openapi.json || exit 1

# L'entrypoint (root) corrige les droits du volume, lance l'ingestion RAG au
# premier démarrage, puis exécute le CMD en tant qu'appuser via gosu.
ENTRYPOINT ["/app/entrypoint.sh"]

# wsgi.py expose `app = create_app()`
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "120", "wsgi:app"]
