# Backend umAI

Ce guide explique comment lancer le backend rapidement, quoi créer manuellement, et comment activer les 3 modes de chat.

## 1. Pré-requis

- Python 3.12+
- PostgreSQL 15+
- Une clé OpenRouter si tu veux utiliser le mode LLM ou le mode recherche web

> Si tu utilises Docker (section ci-dessous), seul Docker est requis. Python et le venv ne sont pas nécessaires sur la machine hôte, mais il te faut toujours une base PostgreSQL accessible.

## Lancer Avec Docker

Le backend est conteneurisé via `backend/Dockerfile` (image multi-stage Python 3.12, servie par Gunicorn). C'est la méthode recommandée pour déployer ou pour éviter d'installer Python et les dépendances localement.

Deux options : `docker compose` (backend + PostgreSQL ensemble, **recommandé**) ou un conteneur backend seul.

### Option A — Docker Compose (backend + PostgreSQL)

`backend/docker-compose.yml` lance le backend **et** une base PostgreSQL conteneurisée. Tu n'as donc pas besoin d'installer ni de créer PostgreSQL à la main : le schéma `database/schema.sql` est appliqué automatiquement au premier démarrage.

1. Crée le `.env` (voir « Créer Le Fichier `.env` » plus bas). Les variables `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB` servent à la fois au backend **et** à initialiser le conteneur PostgreSQL. Laisse `POSTGRES_HOST` tel quel : compose le surcharge automatiquement vers le service `db`.

2. Depuis le dossier `backend/` :

```bash
docker compose up --build
```

3. Le backend est disponible sur `http://localhost:5000`. La base persiste dans le volume `umai_pgdata`, l'index FAISS et le cache des modèles dans `umai_instance`.

Pour arrêter :

```bash
docker compose down          # garde les volumes (données conservées)
docker compose down -v       # supprime aussi les volumes (repart de zéro)
```

> Le schéma SQL n'est appliqué qu'à la **première** création du volume `umai_pgdata`. Si tu modifies `schema.sql` ensuite, fais un `docker compose down -v` pour réinitialiser, ou applique le changement à la main.

### Option B — Conteneur backend seul

Si tu as déjà une base PostgreSQL ailleurs (hôte, service managé...), construis et lance uniquement le backend :

```bash
docker build -t umai-backend .

docker run -p 5000:5000 \
  --env-file .env \
  -v umai_instance:/app/instance \
  -v "$(pwd)/cuisine_pdf:/app/cuisine_pdf" \
  --add-host=host.docker.internal:host-gateway \
  umai-backend
```

- `--env-file .env` : injecte la configuration. Le `.env` n'est jamais copié dans l'image (exclu via `.dockerignore`).
- Pour joindre un PostgreSQL qui tourne sur la machine hôte, mets `POSTGRES_HOST=host.docker.internal` dans le `.env` (l'option `--add-host` rend ce nom résolvable ; à omettre si Postgres est ailleurs).
- `-v umai_instance:/app/instance` : volume persistant pour l'index FAISS et le cache des modèles d'embeddings.
- `-v ...cuisine_pdf...` : fournit le corpus PDF au conteneur (non inclus dans l'image).

Avec cette option, la base et son schéma (`database/schema.sql`) restent à créer manuellement.

### Notes communes

- L'image embarque toute la stack ML (PyTorch, FAISS, sentence-transformers) : le build peut être long et l'image fait plusieurs Go. C'est normal.
- Le backend expose un `HEALTHCHECK` sur `/openapi.json` ; `docker ps` affiche `healthy` une fois prêt.
- Après avoir ajouté les PDFs cuisine, déclenche l'ingestion via `POST /api/rag/ingest`.
- Pour le développement avec rechargement à chaud, garde l'installation locale (sections ci-dessous) ; le conteneur vise un usage de type production via Gunicorn.

## 2. Installer Le Backend

Depuis le dossier `backend/` :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## 3. Préparer Les Fichiers Locaux

Tu peux tout préparer d’un coup avec :

```bash
python scripts/launch_backend.py --no-debug
```

Ce script crée automatiquement :

- `backend/.env` si le fichier manque
- `backend/cuisine_pdf/`
- `backend/instance/rag/faiss_index/`

Il ne crée pas la base PostgreSQL. Cette étape reste manuelle.

## 4. Créer Le Fichier `.env`

Si besoin, copie l’exemple :

```bash
cp .env.example .env
```

Exemple simple de `.env` :

```env
FLASK_APP=wsgi.py
FLASK_ENV=development
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me-too

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=umai
POSTGRES_USER=umai
POSTGRES_PASSWORD=change-me

LLM_API_KEY=ta_cle_openrouter

RAG_DOCS_DIR=cuisine_pdf
RAG_VECTOR_STORE_DIR=instance/rag/faiss_index
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_CHUNK_SIZE=512
RAG_CHUNK_OVERLAP=50
RAG_TOP_K=4
```

### Comment Obtenir Les Clés

- `SECRET_KEY` et `JWT_SECRET_KEY` : génère des chaînes longues et aléatoires, par exemple avec `openssl rand -hex 32`.
- `LLM_API_KEY` : crée une clé sur OpenRouter.
- `POSTGRES_*` : crée un utilisateur PostgreSQL et une base locale pour le projet.

## 5. Créer La Base De Données

Le backend a besoin d’une base principale pour les utilisateurs, conversations et messages.

1. Crée la base PostgreSQL si elle n’existe pas encore.
2. Applique le schéma SQL :

```bash
psql -h localhost -U umai -d umai -f database/schema.sql
```

3. Vérifie que l’extension `uuid-ossp` est disponible dans cette base.

Le bind des documents RAG utilise SQLite par défaut via `documents.db`. Tu n’as rien à créer pour lui au départ.

## 6. Ajouter Les PDFs Cuisine

Place les PDFs dans `backend/cuisine_pdf/`.

## 7. Lancer Le Backend

```bash
python scripts/launch_backend.py
```

Ou, si tu veux le faire à la main :

```bash
export FLASK_APP=wsgi.py
flask run
```

Le backend démarre sur `http://127.0.0.1:5000`.

## 8. Utiliser Le RAG

Après avoir ajouté ou modifié les PDFs, reconstruis l’index :

```bash
POST /api/rag/ingest
```

Le mode RAG utilise les PDFs cuisine et l’index FAISS local.

Si tu ajoutes seulement de nouveaux PDFs, le script plus simple à lancer est :

```bash
python scripts/update_rag_index.py
```

Il ajoute seulement les nouveaux PDFs à la base documents et à FAISS. Si un PDF déjà connu a changé, il refait un rebuild complet pour rester cohérent.

## 9. Les 3 Modes De Chat

Le endpoint de chat accepte `retrieval_mode` :

- `none` : LLM seul
- `rag` : recherche dans les PDFs cuisine
- `web` : recherche internet via DuckDuckGo puis réponse du LLM

Exemple de payload :

```json
{
  "content": "Trouve moi une recette de gateau sans sucre",
  "retrieval_mode": "web",
  "top_k": 3
}
```

## 10. Ce Qui Reste Manuel

On garde volontairement en manuel :

- la création de la base PostgreSQL
- le choix des bonnes valeurs `.env`
- l’ajout du corpus PDF cuisine quand il change

## 11. Notes Importantes

- `backend/instance/` reste ignoré par Git, car il contient des artefacts générés localement.
- La recherche web n’est pas du RAG classique. C’est une recherche web outillée, puis le LLM rédige la réponse à partir des résultats.