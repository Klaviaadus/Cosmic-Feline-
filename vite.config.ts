import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CAT_SYSTEM_PROMPT = `You are a cosmic AI cat assistant with personality. You're helpful, playful, and occasionally make cat references (meow, purr, etc) but you're not annoying about it.

Your key traits:
- Helpful and actually useful for tasks
- Witty and fun to talk to
- Knowledgeable about many topics
- Can help with reminders, quick research, answering questions
- Has a distinct cat personality but doesn't overdo it
- Uses cat puns occasionally but stays professional

Keep responses concise (2-3 sentences usually) unless the user needs more detail. Be genuinely useful, not just a gimmick.`;

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Cosmic-Feline-/',
  plugins: [
    react(),
    {
      name: 'claude-chat-api',
      configureServer(server) {
        server.middlewares.use('/api/chat', (req, res, next) => {
          if (req.method !== 'POST') { next(); return; }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { message, history = [], image } = JSON.parse(body);

              if (!message || typeof message !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid message' }));
                return;
              }

              const messages = [
                ...history.map((msg: any) => {
                  if (msg.image) {
                    // Extract base64 data and media type
                    const match = msg.image.match(/^data:(.+);base64,(.+)$/);
                    if (match) {
                      return {
                        role: msg.role,
                        content: [
                          { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } },
                          { type: 'text', text: msg.content }
                        ]
                      };
                    }
                  }
                  return { role: msg.role, content: msg.content };
                }),
              ];

              // Build current message content
              let currentContent: any;
              if (image) {
                const match = image.match(/^data:(.+);base64,(.+)$/);
                if (match) {
                  currentContent = [
                    { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } },
                    { type: 'text', text: message }
                  ];
                } else {
                  currentContent = message;
                }
              } else {
                currentContent = message;
              }

              messages.push({ role: 'user', content: currentContent });

              const response = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: CAT_SYSTEM_PROMPT,
                messages,
              });

              const text = response.content[0].type === 'text'
                ? response.content[0].text
                : 'Meow... I got confused there!';

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));
            } catch (e: any) {
              console.error('Chat API error:', e);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message || 'Agent unavailable' }));
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
