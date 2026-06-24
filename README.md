# umAI

**umAI** est un assistant conversationnel (chatbot) spécialisé en cuisine. Il
combine un LLM avec deux modes d'enrichissement des réponses :

- 📄 **RAG** — réponses fondées sur un corpus de PDFs cuisine (recherche
  vectorielle via FAISS) ;
- 🌐 **Web** — recherche en ligne (DuckDuckGo) puis rédaction par le LLM ;
- sans enrichissement — le LLM seul.

L'application gère également les comptes utilisateurs (authentification JWT),
l'historique des conversations et l'édition des messages.

## Architecture

Le projet est organisé en trois services :

| Service      | Technologie                         | Rôle                                                       |
| ------------ | ----------------------------------- | ---------------------------------------------------------- |
| **frontend** | Angular 21 (SSR via Express)        | Interface web du chat, authentification, historique       |
| **backend**  | Python 3.12 / Flask (Gunicorn)      | API REST, LLM (OpenRouter), RAG (FAISS), recherche web     |
| **db**       | PostgreSQL 16                       | Utilisateurs, conversations et messages                    |

```
Navigateur ──▶ frontend (SSR :4000) ──/api──▶ backend (Flask :5000) ──▶ db (PostgreSQL)
                                                      │
                                                      ├─▶ OpenRouter (LLM)
                                                      ├─▶ FAISS (index RAG local)
                                                      └─▶ DuckDuckGo (recherche web)
```

## Structure du dépôt

- [backend/](backend/) — API Flask, RAG, intégration LLM
- [frontend/](frontend/) — application Angular
- [docs/](docs/) — documentation (sujet de la SAE, guide Postman/Swagger)
- [docker-compose.yml](docker-compose.yml) — orchestration de la stack complète

## Démarrage rapide avec Docker (recommandé)

C'est la façon la plus simple de tout lancer d'un coup : PostgreSQL, le backend
et le frontend sont construits et démarrés ensemble.

**Prérequis :** Docker et un fichier `backend/.env` (copie de
[backend/.env.example](backend/.env.example), avec au minimum une clé
`LLM_API_KEY` OpenRouter et des secrets renseignés).

```bash
cp backend/.env.example backend/.env   # puis éditer les valeurs
docker compose up --build
```

Une fois la stack démarrée :

- Frontend : http://localhost:4000
- API / Swagger : http://localhost:5000/apidocs

Pour arrêter :

```bash
docker compose down      # conserve les données
docker compose down -v   # supprime aussi les volumes (base, index RAG)
```

## Ingestion RAG (indispensable pour le mode 📄 PDF)

Le mode RAG s'appuie sur un **index FAISS** construit à partir des PDFs de
[backend/cuisine_pdf/](backend/cuisine_pdf/). Cet index **n'existe pas au premier
démarrage** : tant qu'il n'est pas construit, toute question en mode RAG échoue
avec « FAISS index not found. Run ingestion first. »

Lance l'ingestion **une seule fois**, la stack démarrée :

```bash
docker compose exec backend python -c "from rag.service import RagService; print(RagService().ingest())"
```

- Au premier lancement, le modèle d'embeddings (~90 Mo) est téléchargé, puis les
  PDFs sont découpés et indexés : compte quelques minutes.
- L'index est persisté dans le volume `umai_instance` ; il survit à
  `docker compose down`/`up`. Seul `docker compose down -v` l'efface — il faut
  alors relancer l'ingestion.
- À relancer après avoir ajouté ou modifié des PDFs dans `backend/cuisine_pdf/`.

> Les modes 🌐 **Web** et **LLM seul** ne nécessitent pas cette étape.

## Comprendre le `docker-compose.yml`

Le fichier [docker-compose.yml](docker-compose.yml) à la racine définit trois
services et deux volumes persistants. Les services démarrent dans l'ordre des
dépendances : `db` → `backend` → `frontend`.

### Service `db` (PostgreSQL)

- Image `postgres:16-alpine`.
- Lit ses identifiants (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)
  depuis `backend/.env` (`env_file`) : la base et le backend partagent donc la
  même configuration.
- Le schéma [backend/database/schema.sql](backend/database/schema.sql) est monté
  dans `/docker-entrypoint-initdb.d/` et **appliqué automatiquement au premier
  démarrage** (lorsque le volume de données est vide).
- Un `healthcheck` (`pg_isready`) garantit que la base est prête avant que le
  backend ne démarre.
- Données persistées dans le volume `umai_pgdata`.

> ⚠️ Le schéma n'est appliqué qu'à la **création** du volume `umai_pgdata`. Si
> tu modifies `schema.sql` ensuite, fais `docker compose down -v` pour
> réinitialiser la base.

### Service `backend` (Flask)

- Construit depuis [backend/Dockerfile](backend/Dockerfile).
- Charge `backend/.env`, mais **surcharge `POSTGRES_HOST` à `db`** : dans le
  réseau Docker, la base est joignable par le nom du service, pas par
  `localhost`.
- Port `5000` exposé pour accéder directement à l'API et à Swagger.
- Volumes :
  - `umai_instance` — index FAISS et cache des modèles d'embeddings (persistés) ;
  - `./backend/cuisine_pdf` — corpus de PDFs cuisine fourni au conteneur.
- `depends_on: db (service_healthy)` : attend que PostgreSQL soit prêt.

### Service `frontend` (Angular SSR)

- Construit depuis [frontend/Dockerfile](frontend/Dockerfile) (build Angular puis
  serveur SSR Node).
- Écoute sur le port `4000` (`PORT`).
- `BACKEND_URL=http://backend:5000` : le serveur SSR **proxifie les appels
  `/api`** vers le backend via le réseau Docker — aucune configuration CORS
  n'est nécessaire.
- `depends_on: backend` : démarre après le backend.

### Volumes

- `umai_pgdata` — données PostgreSQL.
- `umai_instance` — index FAISS et modèles d'embeddings du backend.

Ces volumes survivent à `docker compose down` et ne sont supprimés qu'avec
`docker compose down -v`.

## Installation manuelle (développement)

Pour le développement avec rechargement à chaud, chaque service peut être lancé
indépendamment. Voir les guides dédiés :

- Backend : [backend/README.md](backend/README.md)
- Frontend : [frontend/README.md](frontend/README.md)

## Documentation

- [docs/postman-swagger-guide.md](docs/postman-swagger-guide.md) — tester l'API
  via Postman / Swagger
- [docs/Sujet_SAE.pdf](docs/Sujet_SAE.pdf) — sujet de la SAE
