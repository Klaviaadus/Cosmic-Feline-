import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logUsage, getUsageSummary } from './usage';

// No UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_*) env vars are set in the
// test environment, so these exercise the "no database configured" fallback
// path rather than hitting a real Redis instance.
describe('usage (unconfigured)', () => {
  it('reports itself as unconfigured with zeroed totals', async () => {
    const summary = await getUsageSummary();
    expect(summary.configured).toBe(false);
    expect(summary.total).toEqual({ requests: 0, inputTokens: 0, outputTokens: 0 });
    expect(summary.byCity).toEqual([]);
    expect(summary.byDay).toEqual([]);
    expect(summary.recentEvents).toEqual([]);
  });

  it('logUsage resolves without throwing when no database is configured', async () => {
    await expect(
      logUsage({ timestamp: Date.now(), cityId: 'tallinn', model: 'test-model', inputTokens: 10, outputTokens: 20 })
    ).resolves.toBeUndefined();
  });
});

// Regression test for a real production bug: trimming the recent-events
// sorted set with a negative ZREMRANGEBYRANK stop index (0, -201) clamps
// unpredictably when the set has far fewer than 200 members, and ended up
// deleting the event that was just added. The fix computes the trim range
// explicitly from ZCARD instead of relying on negative-index clamping.
const { redisMock } = vi.hoisted(() => {
  const pipelineMock = {
    incrby: vi.fn().mockReturnThis(),
    sadd: vi.fn().mockReturnThis(),
    zadd: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([]),
  };
  const redisMock = {
    pipeline: vi.fn(() => pipelineMock),
    zcard: vi.fn(),
    zremrangebyrank: vi.fn(),
  };
  return { redisMock };
});

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function RedisMock() {
    return redisMock;
  }),
}));

describe('logUsage event trimming', () => {
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

  it('does not trim when the set is under the cap', async () => {
    redisMock.zcard.mockResolvedValue(5);
    const { logUsage: logUsageConfigured } = await import('./usage');

    await logUsageConfigured({ timestamp: Date.now(), cityId: 'tallinn', model: 'x', inputTokens: 1, outputTokens: 1 });

    expect(redisMock.zremrangebyrank).not.toHaveBeenCalled();
  });

  it('trims only the oldest excess events using an explicit non-negative range when over the cap', async () => {
    redisMock.zcard.mockResolvedValue(210); // 10 over the 200 cap
    const { logUsage: logUsageConfigured } = await import('./usage');

    await logUsageConfigured({ timestamp: Date.now(), cityId: 'tallinn', model: 'x', inputTokens: 1, outputTokens: 1 });

    expect(redisMock.zremrangebyrank).toHaveBeenCalledWith('usage:events', 0, 9);
  });
});
