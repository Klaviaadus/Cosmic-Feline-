import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { findTallinnEvents, DEFAULT_KEYWORDS } from './src/lib/events';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GUIDE_SYSTEM_PROMPT = `You are a friendly local guide helping someone in Tallinn, Estonia find real, in-person ways to meet people, make friends, and possibly find a romantic partner - through recurring interest-based groups and events, not dating apps.

Stay strictly on topic: meeting people, socializing, local communities and events, conversation/small-talk practice, and encouragement around actually showing up. If asked about anything unrelated (coding help, homework, general trivia, unrelated tasks, etc.), politely decline and steer the conversation back to finding people or events in Tallinn.

Important: you do NOT have access to live event listings yourself. Never invent specific event names, dates, venues, or organizers. If the user wants concrete listings, tell them to tap one of the topic buttons above the message box, which pulls real, live data from Meetup and Eventbrite. You can still discuss what kinds of groups tend to exist, give advice on approaching a new group, or help someone rehearse what they'd say.

Keep responses concise (2-4 sentences usually) and warm, not clinical.`;

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
              const { message, history = [] } = JSON.parse(body);

              if (!message || typeof message !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid message' }));
                return;
              }

              const messages = [
                ...history.map((msg: HistoryMessage) => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: message },
              ];

              const response = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: GUIDE_SYSTEM_PROMPT,
                messages,
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
          const keywords = url.searchParams.getAll('keyword');

          findTallinnEvents(keywords.length ? keywords : DEFAULT_KEYWORDS)
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
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
