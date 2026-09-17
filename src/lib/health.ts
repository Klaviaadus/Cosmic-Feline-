// Tracks whether each event source (Meetup, Eventbrite, Telegram) is still
// returning results per city, so a silent scraping break - like the one that
// took out Discord (blocked by Cloudflare) - gets caught instead of just
// quietly showing users an empty results list. A scheduled cron
// (api/cron/health-check.ts) writes here; api/health.ts reads the latest
// snapshot. Same Redis env var fallback as usage.ts, since different Vercel
// storage integrations name the REST credentials differently.
import { Redis } from '@upstash/redis';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = REST_URL && REST_TOKEN ? new Redis({ url: REST_URL, token: REST_TOKEN }) : null;

export type Source = 'Meetup' | 'Eventbrite' | 'Telegram';

export interface SourceHealth {
  cityId: string;
  source: Source;
  checkedAt: number;
  resultCount: number;
  consecutiveZero: number;
  healthy: boolean;
}

// The cron runs daily, so two consecutive zero-result checks before flagging
// unhealthy - a single zero could just be a slow response, not breakage.
const UNHEALTHY_AFTER = 2;

function statusKey(cityId: string, source: Source): string {
  return `${cityId}:${source}`;
}

export async function recordHealthCheck(cityId: string, source: Source, resultCount: number): Promise<void> {
  if (!redis) return;

  try {
    const field = statusKey(cityId, source);
    const existing = await redis.hget<SourceHealth>('health:status', field);
    const consecutiveZero = resultCount > 0 ? 0 : (existing?.consecutiveZero ?? 0) + 1;

    const entry: SourceHealth = {
      cityId,
      source,
      checkedAt: Date.now(),
      resultCount,
      consecutiveZero,
      healthy: consecutiveZero < UNHEALTHY_AFTER,
    };

    await redis.hset('health:status', { [field]: entry });
  } catch (error) {
    console.error('Failed to record health check:', error);
  }
}

export interface HealthSummary {
  configured: boolean;
  sources: SourceHealth[];
}

export async function getHealthSummary(): Promise<HealthSummary> {
  if (!redis) return { configured: false, sources: [] };

  const raw = await redis.hgetall<Record<string, SourceHealth>>('health:status');
  const sources = Object.values(raw ?? {}).sort(
    (a, b) => a.cityId.localeCompare(b.cityId) || a.source.localeCompare(b.source)
  );

  return { configured: true, sources };
}
