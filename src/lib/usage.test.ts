import { describe, it, expect } from 'vitest';
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
