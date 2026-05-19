# Guide Postman et Swagger pour le backend

Ce document résume quoi envoyer dans Postman, quoi attendre en retour, et comment transformer la collection Postman en documentation type Swagger/OpenAPI.

## Base URL

```text
http://localhost:5000/api/v1
```

## Headers communs

Pour toutes les routes protégées par JWT :

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Variables utiles dans Postman

Crée un environnement Postman avec ces variables :

- `base_url` = `http://localhost:5000/api/v1`
- `token` = vide au départ, puis rempli après login
- `conversation_id` = id d'une conversation créée
- `message_id` = id d'un message créé
- `session_id` = id d'une session LLM créée

Exemple d'URL dans Postman :

```text
{{base_url}}/auth/register
```

## 1. Authentification

### Inscription

- Méthode : `POST`
- URL : `/auth/register`
- Body JSON :

```json
{
  "username": "test_user",
  "email": "test_user@example.com",
  "password": "TestPass123!"
}
```

Réponse attendue : `201`

```json
{
  "access_token": "...",
  "user": {
    "id": "...",
    "username": "test_user",
    "email": "test_user@example.com",
    "created_at": "...",
    "last_login": null,
    "is_active": true
  }
}
```

### Connexion

- Méthode : `POST`
- URL : `/auth/login`
- Body JSON :

```json
{
  "identifier": "test_user",
  "password": "TestPass123!"
}
```

Tu peux aussi mettre l'email dans `identifier`.

Réponse attendue : `200`

```json
{
  "access_token": "...",
  "user": {
    "id": "...",
    "username": "test_user",
    "email": "test_user@example.com",
    "created_at": "...",
    "last_login": "...",
    "is_active": true
  }
}
```

Après ça, copie le token dans la variable `token` de Postman.

### Mon profil

- Méthode : `GET`
- URL : `/auth/me`
- Header : `Authorization: Bearer {{token}}`

Réponse attendue : `200`

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "created_at": "...",
    "last_login": "...",
    "is_active": true
  }
}
```

### Modifier mon profil

- Méthode : `PATCH`
- URL : `/auth/me`
- Body JSON possible :

```json
{
  "username": "nouveau_nom"
}
```

ou

```json
{
  "email": "nouveau@email.com",
  "password": "NouveauMotDePasse123!"
}
```

Réponse attendue : `200`

## 2. Conversations classiques

### Créer une conversation

- Méthode : `POST`
- URL : `/conversations`
- Header : `Authorization: Bearer {{token}}`
- Body JSON :

```json
{
  "title": "Conversation de test",
  "metadata": {
    "source": "postman"
  }
}
```

Réponse attendue : `201`

```json
{
  "conversation": {
    "id": "...",
    "user_id": "...",
    "title": "Conversation de test",
    "metadata": {
      "source": "postman"
    },
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Note : `title` et `metadata` sont optionnels.

### Lister les conversations

- Méthode : `GET`
- URL : `/conversations`
- Header : `Authorization: Bearer {{token}}`

Réponse attendue : `200`

```json
{
  "conversations": [
    {
      "id": "...",
      "user_id": "...",
      "title": "Conversation de test",
      "metadata": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### Récupérer une conversation

- Méthode : `GET`
- URL : `/conversations/{{conversation_id}}`
- Header : `Authorization: Bearer {{token}}`

Réponse attendue : `200`

### Modifier une conversation

- Méthode : `PATCH`
- URL : `/conversations/{{conversation_id}}`
- Body JSON possible :

```json
{
  "title": "Conversation modifiée"
}
```

Réponse attendue : `200`

### Supprimer une conversation

- Méthode : `DELETE`
- URL : `/conversations/{{conversation_id}}`
- Header : `Authorization: Bearer {{token}}`

Réponse attendue : `200`

```json
{
  "message": "conversation deleted"
}
```

## 3. Messages dans une conversation

### Créer un message

- Méthode : `POST`
- URL : `/conversations/{{conversation_id}}/messages`
- Body JSON :

```json
{
  "role": "user",
  "content": "Bonjour, ceci est un message de test.",
  "metadata": {
    "source": "postman"
  }
}
```

Réponse attendue : `201`

```json
{
  "message": {
    "id": "...",
    "conversation_id": "...",
    "user_id": "...",
    "role": "user",
    "content": "Bonjour, ceci est un message de test.",
    "metadata": {
      "source": "postman"
    },
    "created_at": "..."
  }
}
```

### Lister les messages

- Méthode : `GET`
- URL : `/conversations/{{conversation_id}}/messages`
- Header : `Authorization: Bearer {{token}}`

Réponse attendue : `200`

### Récupérer un message

- Méthode : `GET`
- URL : `/conversations/{{conversation_id}}/messages/{{message_id}}`
- Header : `Authorization: Bearer {{token}}`

Réponse attendue : `200`

### Modifier un message

- Méthode : `PATCH`
- URL : `/conversations/{{conversation_id}}/messages/{{message_id}}`
- Body JSON possible :

```json
{
  "content": "Message corrigé"
}
```

Réponse attendue : `200`

### Supprimer un message

- Méthode : `DELETE`
- URL : `/conversations/{{conversation_id}}/messages/{{message_id}}`
- Header : `Authorization: Bearer {{token}}`

Réponse attendue : `200`

```json
{
  "message": "message deleted"
}
```

## 4. Sessions LLM

### Créer une session

- Méthode : `POST`
- URL : `/llm/sessions`
- Body JSON :

```json
{
  "title": "Session IA"
}
```

Réponse attendue : `201`

```json
{
  "session": {
    "id": "...",
    "user_id": "...",
    "title": "Session IA",
    "metadata": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### Lister les sessions

- Méthode : `GET`
- URL : `/llm/sessions`

Réponse attendue : `200`

### Voir une session avec l'historique

- Méthode : `GET`
- URL : `/llm/sessions/{{session_id}}`

Réponse attendue : `200`

```json
{
  "session": { "...": "..." },
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

### Supprimer une session

- Méthode : `DELETE`
- URL : `/llm/sessions/{{session_id}}`

Réponse attendue : `200`

```json
{
  "message": "session deleted"
}
```

### Envoyer un message à la session LLM

- Méthode : `POST`
- URL : `/llm/sessions/{{session_id}}/chat`
- Body JSON :

```json
{
  "content": "Donne-moi une recette simple de crêpes.",
  "model": "mistralai/mistral-7b-instruct",
  "provider": "auto"
}
```

Réponse attendue : `200`

```json
{
  "reply": {
    "id": "...",
    "role": "assistant",
    "content": "..."
  },
  "user_message": {
    "id": "...",
    "role": "user",
    "content": "Donne-moi une recette simple de crêpes."
  }
}
```

## 5. Ordre de test conseillé dans Postman

1. `POST /auth/register`
2. `POST /auth/login`
3. Copier `access_token` dans `token`
4. `GET /auth/me`
5. `POST /conversations`
6. `POST /conversations/{{conversation_id}}/messages`
7. `POST /llm/sessions`
8. `POST /llm/sessions/{{session_id}}/chat`
9. `GET /llm/sessions/{{session_id}}`

## 6. Comment faire une doc type Swagger avec Postman

Postman ne remplace pas Swagger, mais il peut servir à produire une documentation basée sur une collection.

### Méthode simple

1. Crée une collection Postman avec toutes les routes.
2. Ajoute les exemples de requêtes et de réponses pour chaque endpoint.
3. Renseigne les descriptions dans chaque requête.
4. Utilise la fonction de documentation de Postman pour générer une page de doc de collection.

### Méthode la plus proche d'un Swagger

1. Prépare ta collection Postman.
2. Exporte la collection au format OpenAPI 3.0 si ton interface Postman le propose.
3. Importe ensuite ce fichier OpenAPI dans Swagger Editor ou Swagger UI.
4. Tu obtiens une doc interactive comme Swagger, avec les endpoints testables.

### Ce qu'il faut mettre pour que la doc soit propre

- Nom clair pour chaque endpoint.
- Description courte du rôle de la route.
- Exemple de body JSON.
- Exemple de réponse `200` ou `201`.
- Déclaration du header `Authorization` pour les routes protégées.
- Codes d'erreur attendus si possible : `400`, `401`, `403`, `404`, `500`.

### Conseils pratiques

- Garde une collection par groupe de routes : auth, conversations, messages, LLM.
- Utilise un environnement Postman avec `base_url` et `token`.
- Quand une route fonctionne, ajoute un exemple de réponse réelle dans la collection.
- Si tu veux une vraie doc Swagger pour le projet, le mieux est de générer un fichier OpenAPI `openapi.yaml` puis de l'afficher avec Swagger UI.

Le backend expose maintenant la doc Swagger intégrée à ces URLs :

- JSON OpenAPI : `/openapi.json`
- Swagger UI : `/apidocs/`

## 7. Validation rapide

Si tu veux tester sans Swagger :

- lance le backend
- fais `register`
- fais `login`
- récupère le token
- teste une conversation
- teste un message
- teste une session LLM
- teste le chat de session

## 8. Utiliser Ollama si OpenRouter ne répond pas

Si OpenRouter ne répond pas ou si tu veux tester en local, tu peux faire tourner Ollama sur ta machine.

### Config minimale

Dans `backend/.env` :

```text
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3.1
```

### Pré-requis

1. Installer Ollama.
2. Démarrer le service Ollama.
3. Tirer un modèle, par exemple :

```bash
ollama pull llama3.1
```

### Test Postman

Dans `POST /llm/sessions/{{session_id}}/chat`, mets par exemple :

```json
{
  "content": "Explique-moi le pattern repository en une phrase.",
  "provider": "ollama",
  "model": "llama3.1"
}
```

Si tu gardes `LLM_PROVIDER=auto`, le backend essaiera d’abord OpenRouter puis basculera sur Ollama si OpenRouter échoue.

Si tu veux, je peux maintenant te préparer aussi un fichier `openapi.yaml` minimal pour brancher Swagger UI directement sur le backend.
