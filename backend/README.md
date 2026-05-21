# Backend umAI

Backend Flask de umAI pour l'authentification, la gestion des conversations, l'historique de messages et l'intégration LLM via OpenRouter.

## Architecture

Le backend suit une structure en couches pour séparer clairement les responsabilités :

- `app/api/` expose les routes HTTP par domaine fonctionnel.
- `app/services/` contient la logique métier.
- `app/repositories/` centralise l'accès aux données.
- `app/models/` définit les modèles SQLAlchemy.
- `app/llm_service.py` gère les appels OpenRouter et l'ordre de fallback des modèles.
- `app/extensions.py` initialise SQLAlchemy, JWT et Flask-Migrate.
- `app/__init__.py` construit l'application Flask, branche le préfixe `/api` et sert la documentation Swagger.

La base de données cible est PostgreSQL. Si aucune configuration PostgreSQL n'est fournie, l'application retombe sur SQLite en local.

## Prérequis

- Python 3.12+
- PostgreSQL 15+ recommandé
- Une clé API OpenRouter pour activer les sessions LLM

## Configuration

1. Copier le fichier d'exemple d'environnement :

```bash
cp .env.example .env
```

2. Renseigner au minimum les variables suivantes dans `.env` :

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- ou `DATABASE_URL`
- `LLM_API_KEY` pour l'intégration OpenRouter

3. Ajuster le reste si nécessaire :

- `FLASK_ENV` pour le mode de lancement
- `LLM_URL` uniquement si tu dois surcharger l'endpoint OpenRouter par défaut

## Installation

Créer un environnement virtuel puis installer les dépendances :

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Lancer le backend

Depuis le dossier `backend/` :

```bash
export FLASK_APP=wsgi.py
flask run
```

L'application sera accessible sur `http://127.0.0.1:5000`.

## Documentation API

- Swagger UI : `http://127.0.0.1:5000/apidocs`
- Spec OpenAPI : `http://127.0.0.1:5000/openapi.json`

## Intégration LLM

Les sessions LLM passent par OpenRouter uniquement.

Le service essaie les modèles configurés dans `app/llm_service.py` dans l'ordre, puis tombe sur `openrouter/free` en dernier recours.

Le champ `model` envoyé à l'API de chat permet de forcer un modèle précis pour une requête donnée.

## Endpoints principaux

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/<conversation_id>`
- `POST /api/conversations/<conversation_id>/messages`
- `GET /api/llm/sessions`
- `POST /api/llm/sessions`
- `POST /api/llm/sessions/<session_id>/chat`