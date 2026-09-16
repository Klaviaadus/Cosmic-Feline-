import { findEvents, DEFAULT_KEYWORDS } from '../src/lib/events';
import { findTelegramCommunities } from '../src/lib/telegram';
import { getCityById } from '../src/cities';

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
    const city = getCityById(searchParams.get('city'));
    const keywords = searchParams.getAll('keyword');

    // Telegram's directory has no keyword search of its own - we only fetch
    // and locally filter it when there's exactly one specific topic to match
    // against, otherwise (no keyword, or the multi-keyword "surprise me" set)
    // it'd just surface whatever is biggest, which skews toward marketplace/
    // real-estate groups rather than anything about meeting people.
    const [result, communities] = await Promise.all([
      findEvents(city, keywords.length ? keywords : DEFAULT_KEYWORDS),
      keywords.length === 1 ? findTelegramCommunities(city.telegramSlug, keywords[0]) : Promise.resolve([]),
    ]);

    return new Response(JSON.stringify({ ...result, communities }), {
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
