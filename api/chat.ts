import Anthropic from '@anthropic-ai/sdk';

export const config = {
  runtime: 'edge',
};

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

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, history = [], image } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build messages array from history
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

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Agent unavailable' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
