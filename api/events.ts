import { findTallinnEvents, DEFAULT_KEYWORDS } from '../src/lib/events';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const keywords = searchParams.getAll('keyword');

    const result = await findTallinnEvents(keywords.length ? keywords : DEFAULT_KEYWORDS);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Events API error:', error);
    const message = error instanceof Error ? error.message : 'Events unavailable';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
