import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHealthSummary, recordHealthCheck } from './health';

// No UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_*) env vars are set in the
// test environment, so these exercise the "no database configured" fallback
// path rather than hitting a real Redis instance.
describe('health (unconfigured)', () => {
  it('reports itself as unconfigured with no sources', async () => {
    expect(await getHealthSummary()).toEqual({ configured: false, sources: [] });
  });

  it('recordHealthCheck resolves without throwing when no database is configured', async () => {
    await expect(recordHealthCheck('tallinn', 'Meetup', 5)).resolves.toBeUndefined();
  });
});

const { redisMock } = vi.hoisted(() => {
  const redisMock = {
    hget: vi.fn(),
    hset: vi.fn().mockResolvedValue(1),
    hgetall: vi.fn(),
  };
  return { redisMock };
});

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function RedisMock() {
    return redisMock;
  }),
}));

describe('recordHealthCheck', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('resets consecutiveZero to 0 once results come back', async () => {
    redisMock.hget.mockResolvedValue({
      cityId: 'tallinn',
      source: 'Meetup',
      checkedAt: 1,
      resultCount: 0,
      consecutiveZero: 3,
      healthy: false,
    });
    const { recordHealthCheck: record } = await import('./health');

    await record('tallinn', 'Meetup', 4);

    expect(redisMock.hset).toHaveBeenCalledWith('health:status', {
      'tallinn:Meetup': expect.objectContaining({ resultCount: 4, consecutiveZero: 0, healthy: true }),
    });
  });

  it('stays healthy on the first zero-result check', async () => {
    redisMock.hget.mockResolvedValue(null);
    const { recordHealthCheck: record } = await import('./health');

    await record('tallinn', 'Meetup', 0);

    expect(redisMock.hset).toHaveBeenCalledWith('health:status', {
      'tallinn:Meetup': expect.objectContaining({ consecutiveZero: 1, healthy: true }),
    });
  });

  it('flags unhealthy after two consecutive zero-result checks', async () => {
    redisMock.hget.mockResolvedValue({
      cityId: 'tallinn',
      source: 'Meetup',
      checkedAt: 1,
      resultCount: 0,
      consecutiveZero: 1,
      healthy: true,
    });
    const { recordHealthCheck: record } = await import('./health');

    await record('tallinn', 'Meetup', 0);

    expect(redisMock.hset).toHaveBeenCalledWith('health:status', {
      'tallinn:Meetup': expect.objectContaining({ consecutiveZero: 2, healthy: false }),
    });
  });
});

describe('getHealthSummary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('returns sources sorted by city then source', async () => {
    redisMock.hgetall.mockResolvedValue({
      'tbilisi:Meetup': { cityId: 'tbilisi', source: 'Meetup', checkedAt: 1, resultCount: 5, consecutiveZero: 0, healthy: true },
      'tallinn:Telegram': { cityId: 'tallinn', source: 'Telegram', checkedAt: 1, resultCount: 2, consecutiveZero: 0, healthy: true },
      'tallinn:Meetup': { cityId: 'tallinn', source: 'Meetup', checkedAt: 1, resultCount: 0, consecutiveZero: 2, healthy: false },
    });
    const { getHealthSummary: summary } = await import('./health');

    const result = await summary();

    expect(result.configured).toBe(true);
    expect(result.sources.map((s) => `${s.cityId}:${s.source}`)).toEqual([
      'tallinn:Meetup',
      'tallinn:Telegram',
      'tbilisi:Meetup',
    ]);
  });
});
