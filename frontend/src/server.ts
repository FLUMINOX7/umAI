import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Proxy des appels `/api` vers le backend Flask.
 *
 * Reproduit en production le comportement de `proxy.conf.json` utilisé par
 * `ng serve` en développement. La cible est configurable via la variable
 * d'environnement `BACKEND_URL` (par défaut, le backend local).
 */
const backendUrl = process.env['BACKEND_URL'] ?? 'http://localhost:5000';

app.use('/api', (req, res) => {
  const target = new URL(req.originalUrl, backendUrl);
  // node:http ne sait pas parler TLS : on choisit le module selon la cible.
  // Indispensable quand BACKEND_URL est en https (backend Railway public).
  // Sinon la connexion en clair vers le port 443 échoue, ou la redirection
  // 301 http->https de Railway transforme le POST du navigateur en GET (405).
  const backendRequest = target.protocol === 'https:' ? httpsRequest : httpRequest;
  const proxied = backendRequest(
    target,
    {
      method: req.method,
      headers: { ...req.headers, host: target.host },
    },
    (backendRes) => {
      res.writeHead(backendRes.statusCode ?? 502, backendRes.headers);
      backendRes.pipe(res);
    },
  );
  proxied.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'application/json' });
    }
    res.end('{"error":"backend unavailable"}');
  });
  req.pipe(proxied);
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
