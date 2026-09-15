import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { findEvents, DEFAULT_KEYWORDS } from './src/lib/events';
import { getCityById, type City } from './src/cities';
import { logUsage, getUsageSummary } from './src/lib/usage';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(city: City): string {
  return `You are a friendly local guide helping someone in ${city.label}, ${city.country} find real, in-person ways to meet people, make friends, and possibly find a romantic partner - through recurring interest-based groups and events, not dating apps.

Stay strictly on topic: meeting people, socializing, local communities and events, conversation/small-talk practice, and encouragement around actually showing up. If asked about anything unrelated (coding help, homework, general trivia, unrelated tasks, etc.), politely decline and steer the conversation back to finding people or events in ${city.label}.

Important: you do NOT have access to live event listings yourself. Never invent specific event names, dates, venues, or organizers. If the user wants concrete listings, tell them to tap one of the topic buttons above the message box, which pulls real, live data from Meetup and Eventbrite. You can still discuss what kinds of groups tend to exist, give advice on approaching a new group, or help someone rehearse what they'd say.

Keep responses concise (2-4 sentences usually) and warm, not clinical.`;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
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
              const { message, history = [], city: cityId } = JSON.parse(body);

              if (!message || typeof message !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid message' }));
                return;
              }

              const city = getCityById(cityId);

              const messages = [
                ...history.map((msg: HistoryMessage) => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: message },
              ];

              const model = 'claude-haiku-4-5-20251001';
              const response = await anthropic.messages.create({
                model,
                max_tokens: 1024,
                system: buildSystemPrompt(city),
                messages,
              });

              await logUsage({
                timestamp: Date.now(),
                cityId: city.id,
                model,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
              });

              const text = response.content[0].type === 'text'
                ? response.content[0].text
                : "Sorry, I got confused there - could you rephrase?";

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));
            } catch (e) {
              console.error('Chat API error:', e);
              const message = e instanceof Error ? e.message : 'Agent unavailable';
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: message }));
            }
          });
        });
      },
    },
    {
      name: 'events-api',
      configureServer(server) {
        server.middlewares.use('/api/events', (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }
          const url = new URL(req.url ?? '', 'http://localhost');
          const city = getCityById(url.searchParams.get('city'));
          const keywords = url.searchParams.getAll('keyword');

          findEvents(city, keywords.length ? keywords : DEFAULT_KEYWORDS)
            .then((result) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            })
            .catch((e) => {
              console.error('Events API error:', e);
              const message = e instanceof Error ? e.message : 'Events unavailable';
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: message }));
            });
        });
      },
    },
    {
      name: 'usage-api',
      configureServer(server) {
        server.middlewares.use('/api/usage', (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }
          const url = new URL(req.url ?? '', 'http://localhost');
          const key = url.searchParams.get('key');
          if (!process.env.DASHBOARD_SECRET || key !== process.env.DASHBOARD_SECRET) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          getUsageSummary()
            .then((summary) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(summary));
            })
            .catch((e) => {
              console.error('Usage API error:', e);
              const message = e instanceof Error ? e.message : 'Usage unavailable';
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: message }));
            });
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
