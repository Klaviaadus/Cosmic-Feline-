import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, incrementRateLimit, getTimeUntilReset } from './rateLimit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should allow messages when under limit', () => {
    const result = checkRateLimit();
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(20);
  });

  it('should decrement remaining count after increment', () => {
    incrementRateLimit();
    const result = checkRateLimit();
    expect(result.remaining).toBe(19);
  });

  it('should block after 20 messages', () => {
    // Send 20 messages
    for (let i = 0; i < 20; i++) {
      incrementRateLimit();
    }

    const result = checkRateLimit();
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should persist count in localStorage', () => {
    incrementRateLimit();
    incrementRateLimit();

    // Check that it persists
    const result = checkRateLimit();
    expect(result.remaining).toBe(18);
  });

  it('should have valid reset time', () => {
    const result = checkRateLimit();
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should format time until reset correctly', () => {
    const futureTime = Date.now() + 1000 * 60 * 90; // 90 minutes
    const formatted = getTimeUntilReset(futureTime);
    expect(formatted).toContain('h');
    expect(formatted).toContain('m');
  });

  it('should return "now" for past reset time', () => {
    const pastTime = Date.now() - 1000;
    const formatted = getTimeUntilReset(pastTime);
    expect(formatted).toBe('now');
  });
});
