import { GameStats, GameSettings, Achievement, DEFAULT_STATS, DEFAULT_SETTINGS, DEFAULT_ACHIEVEMENTS } from './game';

const KEYS = {
  stats: 'cosmic-feline-stats',
  settings: 'cosmic-feline-settings',
  achievements: 'cosmic-feline-achievements',
} as const;

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(KEYS.stats);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(KEYS.stats, JSON.stringify(stats));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch {
    // silently ignore
  }
}

export function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(KEYS.achievements);
    if (!raw) return DEFAULT_ACHIEVEMENTS;
    const parsed = JSON.parse(raw) as Achievement[];
    // Merge with defaults in case new achievements were added
    return DEFAULT_ACHIEVEMENTS.map(def => {
      const saved = parsed.find(a => a.id === def.id);
      return saved ? { ...def, unlocked: saved.unlocked } : def;
    });
  } catch {
    return DEFAULT_ACHIEVEMENTS;
  }
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(KEYS.achievements, JSON.stringify(achievements));
  } catch {
    // silently ignore
  }
}
