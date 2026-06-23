# syntax=docker/dockerfile:1

# ----------------------------------------------------------------------------
# Stage 1 : builder — compile l'application Angular (SSR)
# ----------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Installation des dépendances (cache Docker tant que les lockfiles ne changent pas)
COPY package.json package-lock.json ./
RUN npm ci

# Code source puis build de production (génère dist/umAI : browser/ + server/)
COPY . .
RUN npm run build

# ----------------------------------------------------------------------------
# Stage 2 : runtime — serveur SSR Node
# ----------------------------------------------------------------------------
FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    PORT=4000 \
    # Cible du proxy /api : nom du service backend dans le réseau Docker
    BACKEND_URL=http://backend:5000

WORKDIR /app

# Le bundle serveur est autonome (express et @angular/ssr y sont inclus) :
# seul dist/umAI est nécessaire, pas de node_modules.
COPY --from=builder /app/dist/umAI ./

# Exécution sous un utilisateur non-root
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost:4000/favicon.ico || exit 1

# Démarre le serveur Express SSR (écoute sur $PORT)
CMD ["node", "server/server.mjs"]
