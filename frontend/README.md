# umAI — Frontend

Interface web du chatbot **umAI**, développée avec **Angular 21**. L'application
offre une expérience de conversation avec un LLM, la gestion de comptes
utilisateurs et l'historique des échanges.
*frontend* : il dialogue avec une API backend (Flask)

## Fonctionnalités

- **Conversation avec le LLM** — envoi de messages et affichage des réponses,
  avec rendu **Markdown** des réponses de l'IA.
- **Deux modes de recherche** — bascule entre :
  - 📄 **PDF (RAG)** : réponses fondées sur un contexte documentaire ;
  - 🌐 **Web** : recherche en ligne (DuckDuckGo).
- **Gestion des conversations** — création, sélection, renommage et suppression
  des sessions depuis la barre latérale.
- **Gestion des messages** — modification et suppression des messages, avec
  mises à jour optimistes (rollback automatique en cas d'erreur réseau).
- **Authentification** — inscription, connexion et déconnexion. Le jeton JWT est
  stocké dans le `localStorage` et injecté automatiquement sur chaque requête via
  un *interceptor* HTTP.
- **Profil utilisateur** — mise à jour des informations du compte
  (nom d'utilisateur, e-mail, mot de passe) et suppression du compte.
- **Indicateur d'état** — vérification de la disponibilité de l'API backend
  (`/api/health`).
- **Rendu serveur (SSR)** — l'application est servie via Angular SSR + Express.

## Prérequis

- **Node.js** ≥ 20
- **npm** 11 (déclaré via `packageManager`)
- Le **backend umAI** doit être lancé et accessible sur `http://127.0.0.1:5000`
  (voir `../backend`). En développement, les requêtes vers `/api` sont
  redirigées vers ce serveur grâce au proxy (`proxy.conf.json`).

## Installation

```bash
npm install
```

## Serveur de développement

Pour démarrer le serveur de développement avec le proxy vers le backend :

```bash
npm start
```

Cette commande lance `ng serve --proxy-config proxy.conf.json`. Une fois le
serveur démarré, ouvrez votre navigateur à l'adresse
`http://localhost:4200/`. L'application se recharge automatiquement à chaque
modification d'un fichier source.

> ℹ️ La commande `ng serve` seule fonctionne aussi, mais sans le proxy les
> appels `/api` n'aboutiront pas.

## Compilation (build)

Pour compiler le projet :

```bash
npm run build
```

Les artefacts sont générés dans le répertoire `dist/`. Par défaut, la
configuration de production optimise l'application pour la performance.

Pour recompiler automatiquement à chaque changement (configuration de
développement) :

```bash
npm run watch
```

## Rendu côté serveur (SSR)

Après un build, le serveur SSR peut être lancé avec :

```bash
npm run serve:ssr:umAI
```

## Structure du projet

```
src/
├── app/
│   ├── components/        Composants d'interface
│   │   ├── chat-header/     En-tête + bascule des modes RAG / Web
│   │   ├── composer/        Champ de saisie et envoi des messages
│   │   ├── health-status/   Indicateur d'état de l'API
│   │   ├── login-modal/     Fenêtre de connexion
│   │   ├── register-modal/  Fenêtre d'inscription
│   │   ├── register-button/ Bouton d'inscription
│   │   ├── message-bubble/  Bulle de message (rendu Markdown, édition)
│   │   ├── message-list/    Liste des messages
│   │   ├── sidebar/         Barre latérale (conversations, compte)
│   │   └── user-profile-modal/  Gestion du profil utilisateur
│   ├── interceptors/      Interceptor d'authentification (JWT)
│   ├── interfaces/        Types des messages / conversations
│   ├── models/            Modèles de données
│   ├── pages/chat/        Page principale du chat (état via signals)
│   └── services/          Accès à l'API
│       ├── auth.service.ts          Authentification
│       ├── chat.service.ts          Historique local (localStorage)
│       ├── conversation.service.ts  Sessions, messages, chat LLM
│       ├── health.service.ts        État de l'API
│       └── user-profile.service.ts  Profil utilisateur
│   ├── app.config.ts      Configuration de l'application (client)
│   ├── app.config.server.ts  Configuration SSR
│   └── app.routes.ts      Routes
├── server.ts             Serveur Express (SSR)
├── main.ts               Point d'entrée navigateur
└── main.server.ts        Point d'entrée serveur
```

## API consommée

Le frontend communique avec le backend via le préfixe `/api` :

| Domaine        | Endpoints principaux                                              |
| -------------- | ---------------------------------------------------------------- |
| Authentification | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PATCH/DELETE /api/auth/me` |
| Sessions LLM   | `GET/POST /api/llm/sessions`, `GET/DELETE /api/llm/sessions/{id}`, `POST /api/llm/sessions/{id}/chat` |
| Conversations  | `PATCH /api/conversations/{id}`, `PATCH/DELETE /api/conversations/{id}/messages/{msg}` |
| Santé          | `GET /api/health`                                                |

La cible du proxy est configurable dans [`proxy.conf.json`](proxy.conf.json).

## Ressources

- [Angular CLI — vue d'ensemble et référence des commandes](https://angular.dev/tools/cli)
- [Vitest](https://vitest.dev/)
</content>
</invoke>
