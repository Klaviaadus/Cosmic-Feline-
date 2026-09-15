// Tracks Anthropic token usage per chat request so we can see how tokens
// are burning while people test the app. Backed by Upstash Redis (works
// over REST/fetch, so it's compatible with the edge runtime api/chat.ts
// already runs on).
//
// Different Vercel storage integrations name the REST credentials
// differently depending on how the database was created, so we check both
// conventions we're likely to see: a direct Upstash integration
// (UPSTASH_REDIS_REST_*) and the older "Vercel KV" branding (KV_REST_API_*).
import { Redis } from '@upstash/redis';

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = REST_URL && REST_TOKEN ? new Redis({ url: REST_URL, token: REST_TOKEN }) : null;

export interface UsageEvent {
  timestamp: number;
  cityId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

const MAX_RECENT_EVENTS = 200;

function dayBucket(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export async function logUsage(event: UsageEvent): Promise<void> {
  if (!redis) return; // no database configured - silently no-op (e.g. local dev without env vars)

  try {
    const day = dayBucket(event.timestamp);
    const pipeline = redis.pipeline();

    pipeline.incrby('usage:total:requests', 1);
    pipeline.incrby('usage:total:input_tokens', event.inputTokens);
    pipeline.incrby('usage:total:output_tokens', event.outputTokens);

    pipeline.incrby(`usage:city:${event.cityId}:requests`, 1);
    pipeline.incrby(`usage:city:${event.cityId}:input_tokens`, event.inputTokens);
    pipeline.incrby(`usage:city:${event.cityId}:output_tokens`, event.outputTokens);
    pipeline.sadd('usage:cities', event.cityId);

    pipeline.incrby(`usage:day:${day}:requests`, 1);
    pipeline.incrby(`usage:day:${day}:input_tokens`, event.inputTokens);
    pipeline.incrby(`usage:day:${day}:output_tokens`, event.outputTokens);
    pipeline.sadd('usage:days', day);

    // @upstash/redis auto-serializes objects on write and auto-deserializes
    // JSON-looking strings on read, so pass the object directly - manually
    // JSON.stringify-ing here caused getUsageSummary's JSON.parse to choke
    // on an already-parsed object and silently drop every event.
    pipeline.zadd('usage:events', { score: event.timestamp, member: event });

    await pipeline.exec();

    // Trim in a separate step using an explicit, non-negative rank range - a
    // negative stop index here (e.g. 0, -201) clamps unpredictably when the
    // set has far fewer than MAX_RECENT_EVENTS members and can wipe out the
    // event we just added.
    const count = await redis.zcard('usage:events');
    if (count > MAX_RECENT_EVENTS) {
      await redis.zremrangebyrank('usage:events', 0, count - MAX_RECENT_EVENTS - 1);
    }
  } catch (error) {
    console.error('Failed to log usage:', error);
  }
}

export interface CityUsage {
  cityId: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

export interface DayUsage {
  day: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

export interface UsageSummary {
  configured: boolean;
  total: { requests: number; inputTokens: number; outputTokens: number };
  byCity: CityUsage[];
  byDay: DayUsage[];
  recentEvents: UsageEvent[];
}

export async function getUsageSummary(): Promise<UsageSummary> {
  if (!redis) {
    return {
      configured: false,
      total: { requests: 0, inputTokens: 0, outputTokens: 0 },
      byCity: [],
      byDay: [],
      recentEvents: [],
    };
  }

  const [totalRequests, totalInput, totalOutput, cityIds, days, recentEventsRaw] = await Promise.all([
    redis.get<number>('usage:total:requests'),
    redis.get<number>('usage:total:input_tokens'),
    redis.get<number>('usage:total:output_tokens'),
    redis.smembers('usage:cities'),
    redis.smembers('usage:days'),
    redis.zrange<UsageEvent[]>('usage:events', 0, MAX_RECENT_EVENTS, { rev: true }),
  ]);

  const byCity: CityUsage[] = await Promise.all(
    cityIds.map(async (cityId) => {
      const [requests, inputTokens, outputTokens] = await Promise.all([
        redis.get<number>(`usage:city:${cityId}:requests`),
        redis.get<number>(`usage:city:${cityId}:input_tokens`),
        redis.get<number>(`usage:city:${cityId}:output_tokens`),
      ]);
      return { cityId, requests: requests ?? 0, inputTokens: inputTokens ?? 0, outputTokens: outputTokens ?? 0 };
    })
  );

  const byDay: DayUsage[] = (
    await Promise.all(
      days.map(async (day) => {
        const [requests, inputTokens, outputTokens] = await Promise.all([
          redis.get<number>(`usage:day:${day}:requests`),
          redis.get<number>(`usage:day:${day}:input_tokens`),
          redis.get<number>(`usage:day:${day}:output_tokens`),
        ]);
        return { day, requests: requests ?? 0, inputTokens: inputTokens ?? 0, outputTokens: outputTokens ?? 0 };
      })
    )
  ).sort((a, b) => a.day.localeCompare(b.day));

  // @upstash/redis already deserializes each member back into an object -
  // just guard against unexpected/malformed entries rather than re-parsing.
  const recentEvents: UsageEvent[] = recentEventsRaw.filter(
    (e): e is UsageEvent => typeof e === 'object' && e !== null && typeof (e as UsageEvent).timestamp === 'number'
  );

  return {
    configured: true,
    total: {
      requests: totalRequests ?? 0,
      inputTokens: totalInput ?? 0,
      outputTokens: totalOutput ?? 0,
    },
    byCity: byCity.sort((a, b) => b.requests - a.requests),
    byDay,
    recentEvents,
  };
}
