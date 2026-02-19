import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Cosmic-Feline-/',
  plugins: [
    react(),
    {
      name: 'openclaw-chat-api',
      configureServer(server) {
        server.middlewares.use('/api/chat', (req, res, next) => {
          if (req.method !== 'POST') { next(); return; }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { message } = JSON.parse(body);
              const escaped = message.replace(/"/g, '\\"');
              // First message: set model to haiku for the session
              if (!global.gameSessionInitialized) {
                execSync(`openclaw agent --session-id game-cosmic-feline --message "/model haiku" --json`, { encoding: 'utf8', timeout: 30000 });
                global.gameSessionInitialized = true;
              }
              const output = execSync(
                `openclaw agent --session-id game-cosmic-feline --message "${escaped}" --json`,
                { timeout: 60000, encoding: 'utf8' }
              );
              const data = JSON.parse(output);
              const text = data.result?.payloads?.[0]?.text ?? 'Meow... no response.';
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Agent unavailable' }));
            }
          });
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
