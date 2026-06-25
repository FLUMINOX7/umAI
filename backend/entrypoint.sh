#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Entrypoint exécuté en root au démarrage du conteneur.
#
# 1. Le volume Railway monté sur /app/instance appartient à root : on (re)crée
#    les dossiers attendus et on en rend la propriété à appuser, sinon le
#    process applicatif (non-root) ne pourrait pas y écrire — c'est exactement
#    ce qui faisait échouer le téléchargement du modèle Whisper et l'index FAISS.
# 2. Ingestion RAG au tout premier démarrage uniquement : si l'index FAISS est
#    absent du volume, on le construit. Aux démarrages suivants il est déjà là
#    et persistant, donc on saute cette étape.
# 3. On lâche les privilèges et on exécute le CMD (gunicorn) en tant qu'appuser.
# ---------------------------------------------------------------------------

mkdir -p /app/instance/rag/faiss_index
chown -R appuser:appuser /app/instance

if [ ! -f /app/instance/rag/faiss_index/index.faiss ]; then
    echo "[entrypoint] Index FAISS absent : ingestion RAG initiale..."
    gosu appuser python scripts/update_rag_index.py --full-rebuild
else
    echo "[entrypoint] Index FAISS présent : ingestion ignorée."
fi

exec gosu appuser "$@"
