const RATE_LIMIT_KEY = 'cosmic_cat_rate_limit';
const MAX_MESSAGES_PER_DAY = 20;

interface RateLimitData {
  count: number;
  resetTime: number;
}

export function checkRateLimit(): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const stored = localStorage.getItem(RATE_LIMIT_KEY);

  let data: RateLimitData;

  if (stored) {
    data = JSON.parse(stored);

    // Reset if past reset time
    if (now >= data.resetTime) {
      data = {
        count: 0,
        resetTime: getNextResetTime(),
      };
    }
  } else {
    data = {
      count: 0,
      resetTime: getNextResetTime(),
    };
  }

  const allowed = data.count < MAX_MESSAGES_PER_DAY;
  const remaining = Math.max(0, MAX_MESSAGES_PER_DAY - data.count);

  return { allowed, remaining, resetTime: data.resetTime };
}

export function incrementRateLimit(): void {
  const now = Date.now();
  const stored = localStorage.getItem(RATE_LIMIT_KEY);

  let data: RateLimitData;

  if (stored) {
    data = JSON.parse(stored);

    if (now >= data.resetTime) {
      data = {
        count: 1,
        resetTime: getNextResetTime(),
      };
    } else {
      data.count++;
    }
  } else {
    data = {
      count: 1,
      resetTime: getNextResetTime(),
    };
  }

  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
}

function getNextResetTime(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

export function getTimeUntilReset(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return 'now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
