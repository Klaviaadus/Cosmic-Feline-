import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadStats, saveStats, loadSettings, saveSettings, loadAchievements, saveAchievements } from './storage';
import { DEFAULT_STATS, DEFAULT_SETTINGS, DEFAULT_ACHIEVEMENTS } from './game';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k in store) delete store[k]; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn(() => null),
};

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('stats persistence', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadStats()).toEqual(DEFAULT_STATS);
  });

  it('round-trips stats through save/load', () => {
    const stats = { ...DEFAULT_STATS, coins: 999, level: 5 };
    saveStats(stats);
    expect(loadStats()).toEqual(stats);
  });

  it('returns defaults for corrupted data', () => {
    store['cosmic-feline-stats'] = 'not json';
    expect(loadStats()).toEqual(DEFAULT_STATS);
  });
});

describe('settings persistence', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips settings', () => {
    const settings = { ...DEFAULT_SETTINGS, soundEnabled: false, catName: 'Luna' };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });
});

describe('achievements persistence', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadAchievements()).toEqual(DEFAULT_ACHIEVEMENTS);
  });

  it('preserves unlocked state through save/load', () => {
    const achievements = DEFAULT_ACHIEVEMENTS.map(a => a.id === '2' ? { ...a, unlocked: true } : a);
    saveAchievements(achievements);
    const loaded = loadAchievements();
    expect(loaded.find(a => a.id === '2')!.unlocked).toBe(true);
  });
});
