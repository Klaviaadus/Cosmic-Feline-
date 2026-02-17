import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STATS,
  computeLevel,
  feedCat,
  playCat,
  petCat,
  checkAchievements,
  buyItem,
  DEFAULT_ACHIEVEMENTS,
} from './game';

describe('computeLevel', () => {
  it('returns 1 for 0 experience', () => {
    expect(computeLevel(0)).toBe(1);
  });

  it('returns 2 at 100 experience', () => {
    expect(computeLevel(100)).toBe(2);
  });

  it('returns 1 at 99 experience', () => {
    expect(computeLevel(99)).toBe(1);
  });

  it('returns 6 at 500 experience', () => {
    expect(computeLevel(500)).toBe(6);
  });
});

describe('feedCat', () => {
  it('returns null when not enough coins', () => {
    const stats = { ...DEFAULT_STATS, coins: 5 };
    expect(feedCat(stats)).toBeNull();
  });

  it('increases happiness, energy, experience and decreases coins', () => {
    const stats = { ...DEFAULT_STATS, coins: 50, happiness: 50, energy: 50 };
    const result = feedCat(stats)!;
    expect(result.happiness).toBe(70);
    expect(result.energy).toBe(65);
    expect(result.coins).toBe(40);
    expect(result.experience).toBe(5);
    expect(result.feedCount).toBe(1);
  });

  it('caps happiness at 100', () => {
    const stats = { ...DEFAULT_STATS, happiness: 90, coins: 10 };
    const result = feedCat(stats)!;
    expect(result.happiness).toBe(100);
  });

  it('caps energy at 100', () => {
    const stats = { ...DEFAULT_STATS, energy: 95, coins: 10 };
    const result = feedCat(stats)!;
    expect(result.energy).toBe(100);
  });
});

describe('playCat', () => {
  it('returns null when not enough energy', () => {
    const stats = { ...DEFAULT_STATS, energy: 10 };
    expect(playCat(stats)).toBeNull();
  });

  it('increases happiness, coins, experience and decreases energy', () => {
    const stats = { ...DEFAULT_STATS, energy: 50, happiness: 50, coins: 0 };
    const result = playCat(stats)!;
    expect(result.happiness).toBe(65);
    expect(result.energy).toBe(30);
    expect(result.coins).toBe(15);
    expect(result.experience).toBe(10);
    expect(result.playCount).toBe(1);
  });

  it('caps happiness at 100', () => {
    const stats = { ...DEFAULT_STATS, happiness: 95, energy: 30 };
    const result = playCat(stats)!;
    expect(result.happiness).toBe(100);
  });
});

describe('petCat', () => {
  it('increases happiness and experience', () => {
    const stats = { ...DEFAULT_STATS, happiness: 40 };
    const result = petCat(stats);
    expect(result.happiness).toBe(45);
    expect(result.experience).toBe(2);
  });

  it('caps happiness at 100', () => {
    const stats = { ...DEFAULT_STATS, happiness: 98 };
    const result = petCat(stats);
    expect(result.happiness).toBe(100);
  });
});

describe('checkAchievements', () => {
  it('unlocks "Caring Owner" after 10 feeds', () => {
    const stats = { ...DEFAULT_STATS, feedCount: 10 };
    const result = checkAchievements(stats, DEFAULT_ACHIEVEMENTS);
    expect(result.find(a => a.id === '2')!.unlocked).toBe(true);
  });

  it('does not unlock "Caring Owner" before 10 feeds', () => {
    const stats = { ...DEFAULT_STATS, feedCount: 9 };
    const result = checkAchievements(stats, DEFAULT_ACHIEVEMENTS);
    expect(result.find(a => a.id === '2')!.unlocked).toBe(false);
  });

  it('unlocks "Space Explorer" at level 5', () => {
    const stats = { ...DEFAULT_STATS, level: 5 };
    const result = checkAchievements(stats, DEFAULT_ACHIEVEMENTS);
    expect(result.find(a => a.id === '3')!.unlocked).toBe(true);
  });

  it('unlocks "Cosmic Collector" at 1000 coins', () => {
    const stats = { ...DEFAULT_STATS, coins: 1000 };
    const result = checkAchievements(stats, DEFAULT_ACHIEVEMENTS);
    expect(result.find(a => a.id === '4')!.unlocked).toBe(true);
  });

  it('keeps already-unlocked achievements unlocked', () => {
    const result = checkAchievements(DEFAULT_STATS, DEFAULT_ACHIEVEMENTS);
    expect(result.find(a => a.id === '1')!.unlocked).toBe(true);
  });
});

describe('buyItem', () => {
  it('returns null when not enough coins', () => {
    const stats = { ...DEFAULT_STATS, coins: 10 };
    expect(buyItem(stats, 25, { happiness: 30 })).toBeNull();
  });

  it('deducts cost and applies effect', () => {
    const stats = { ...DEFAULT_STATS, coins: 100, happiness: 50 };
    const result = buyItem(stats, 25, { happiness: 30 })!;
    expect(result.coins).toBe(75);
    expect(result.happiness).toBe(80);
  });

  it('caps happiness at 100 on purchase', () => {
    const stats = { ...DEFAULT_STATS, coins: 100, happiness: 90 };
    const result = buyItem(stats, 25, { happiness: 30 })!;
    expect(result.happiness).toBe(100);
  });

  it('applies energy effect', () => {
    const stats = { ...DEFAULT_STATS, coins: 100, energy: 30 };
    const result = buyItem(stats, 40, { energy: 50 })!;
    expect(result.energy).toBe(80);
    expect(result.coins).toBe(60);
  });
});
