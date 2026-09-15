import Anthropic from '@anthropic-ai/sdk';

export const config = {
  runtime: 'edge',
};

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

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Guide unavailable';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
