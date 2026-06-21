# Backend umAI

Ce guide explique comment lancer le backend rapidement, quoi créer manuellement, et comment activer les 3 modes de chat.

## 1. Pré-requis

- Python 3.12+
- PostgreSQL 15+
- Une clé OpenRouter si tu veux utiliser le mode LLM ou le mode recherche web

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