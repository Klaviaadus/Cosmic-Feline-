import { CITIES } from '../../src/cities';
import { findEvents, DEFAULT_KEYWORDS } from '../../src/lib/events';
import { countTelegramGroups } from '../../src/lib/telegram';
import { recordHealthCheck } from '../../src/lib/health';

export const config = {
  runtime: 'edge',
};

// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on
// cron-triggered requests when that env var is set - this keeps the endpoint
// from being triggered by anyone who finds the URL.
export default async function handler(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await Promise.all(
    CITIES.map(async (city) => {
      const [events, telegramCount] = await Promise.all([
        findEvents(city, DEFAULT_KEYWORDS),
        countTelegramGroups(city.telegramSlug),
      ]);

      await Promise.all([
        recordHealthCheck(city.id, 'Meetup', events.meetup.length),
        recordHealthCheck(city.id, 'Eventbrite', events.eventbrite.length),
        recordHealthCheck(city.id, 'Telegram', telegramCount),
      ]);
    })
  );

  return new Response('ok', { status: 200 });
}
