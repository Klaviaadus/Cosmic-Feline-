export interface GameStats {
  level: number;
  experience: number;
  happiness: number;
  energy: number;
  coins: number;
  lastFed: number;
  lastPlayed: number;
  feedCount: number;
  playCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  catName: string;
}

export const DEFAULT_STATS: GameStats = {
  level: 1,
  experience: 0,
  happiness: 80,
  energy: 70,
  coins: 100,
  lastFed: Date.now(),
  lastPlayed: Date.now(),
  feedCount: 0,
  playCount: 0,
};

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  reducedMotion: false,
  catName: 'Cosmic Feline',
};

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Play with your cosmic feline for the first time', unlocked: true },
  { id: '2', title: 'Caring Owner', description: 'Feed your feline 10 times', unlocked: false },
  { id: '3', title: 'Space Explorer', description: 'Reach level 5', unlocked: false },
  { id: '4', title: 'Cosmic Collector', description: 'Collect 1000 stardust coins', unlocked: false },
];

export function computeLevel(experience: number): number {
  return Math.floor(experience / 100) + 1;
}

export function feedCat(stats: GameStats): GameStats | null {
  if (stats.coins < 10) return null;
  return {
    ...stats,
    happiness: Math.min(100, stats.happiness + 20),
    energy: Math.min(100, stats.energy + 15),
    coins: stats.coins - 10,
    experience: stats.experience + 5,
    lastFed: Date.now(),
    feedCount: stats.feedCount + 1,
  };
}

export function playCat(stats: GameStats): GameStats | null {
  if (stats.energy < 20) return null;
  return {
    ...stats,
    happiness: Math.min(100, stats.happiness + 15),
    energy: stats.energy - 20,
    coins: stats.coins + 15,
    experience: stats.experience + 10,
    lastPlayed: Date.now(),
    playCount: stats.playCount + 1,
  };
}

export function petCat(stats: GameStats): GameStats {
  return {
    ...stats,
    happiness: Math.min(100, stats.happiness + 5),
    experience: stats.experience + 2,
  };
}

export function checkAchievements(stats: GameStats, achievements: Achievement[]): Achievement[] {
  return achievements.map(a => {
    if (a.unlocked) return a;
    switch (a.id) {
      case '2': return { ...a, unlocked: stats.feedCount >= 10 };
      case '3': return { ...a, unlocked: stats.level >= 5 };
      case '4': return { ...a, unlocked: stats.coins >= 1000 };
      default: return a;
    }
  });
}

export function buyItem(stats: GameStats, cost: number, effect: Partial<GameStats>): GameStats | null {
  if (stats.coins < cost) return null;
  return {
    ...stats,
    coins: stats.coins - cost,
    happiness: Math.min(100, (effect.happiness ?? 0) + stats.happiness),
    energy: Math.min(100, (effect.energy ?? 0) + stats.energy),
    experience: stats.experience + (effect.experience ?? 0),
  };
}
