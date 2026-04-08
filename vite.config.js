import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { pathToFileURL } from 'url'
import { readFileSync, existsSync } from 'fs'

// Load .env variables so api/ handlers can access process.env in local dev
function loadEnv() {
  const envPath = path.resolve('.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

// Plugin: serve api/ serverless functions locally (mirrors Vercel behaviour)
function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        // Strip query string to get the file path
        const urlPath = req.url.split('?')[0]; // e.g. /api/generate/brand-dna
        const handlerPath = path.resolve('.' + urlPath + '.js');

        if (!existsSync(handlerPath)) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `API handler not found: ${urlPath}` }));
          return;
        }

        try {
          // Parse body
          let body = '';
          await new Promise((resolve) => {
            req.on('data', (chunk) => (body += chunk));
            req.on('end', resolve);
          });
          try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }

          // Build a minimal res wrapper
          const resWrapper = {
            statusCode: 200,
            _headers: {},
            status(code) { this.statusCode = code; return this; },
            setHeader(k, v) { res.setHeader(k, v); },
            json(data) {
              res.statusCode = this.statusCode;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            send(data) {
              res.statusCode = this.statusCode;
              res.end(data);
            },
          };

          // Bust module cache so hot reload works
          const fileUrl = pathToFileURL(handlerPath).href + '?t=' + Date.now();
          const mod = await import(fileUrl);
          const handler = mod.default || mod;
          await handler(req, resWrapper);
        } catch (err) {
          console.error('[local-api] Handler error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error', details: err.message }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  // Define process.env for browser-side code
  define: {
    'process.env.GROQ_API_KEY': JSON.stringify(process.env.GROQ_API_KEY),
    'process.env.NVIDIA_API_KEY': JSON.stringify(process.env.NVIDIA_API_KEY),
    'process.env.VITE_USE_AI_PROXY': JSON.stringify(process.env.VITE_USE_AI_PROXY || 'true')
  },
  server: {
    proxy: {
      '/nvidia-api': {
        target: 'https://ai.api.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nvidia-api/, ''),
        secure: true,
      },
      '/groq-api': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/groq-api/, ''),
        secure: true,
      },
    },
  },
})
