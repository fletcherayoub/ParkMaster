import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'nudge-player' });

interface PlayerState {
  coins: number;
  gems: number;
  ownedSkins: string[];
  equippedSkin: string;
  bestScore: number;
  bestDailyScore: number;
  streakDays: number;
  lastPlayedDate: string | null;
  soundVolume: number;
  musicVolume: number;
  completedMissions: string[];
  missionProgress: Record<string, number>;

  hydrate: () => void;
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  unlockSkin: (id: string, cost: number) => boolean;
  equipSkin: (id: string) => void;
  reportRunEnd: (score: number, mode?: 'endless' | 'daily') => void;
  claimDailyReward: () => { streakDays: number; coinsAwarded: number } | null;
  setSoundVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  updateMissionProgress: (key: string, value: number) => void;
  claimMissionReward: (id: string, reward: number) => void;
}

const DEFAULT_SKIN = 'bike';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC-based
}

function persist(state: Partial<PlayerState>) {
  Object.entries(state).forEach(([key, value]) => {
    if (typeof value === 'function') return;
    storage.set(key, JSON.stringify(value));
  });
}

function load<T>(key: string, fallback: T): T {
  const raw = storage.getString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  coins: 0,
  gems: 0,
  ownedSkins: [DEFAULT_SKIN],
  equippedSkin: DEFAULT_SKIN,
  bestScore: 0,
  bestDailyScore: 0,
  streakDays: 0,
  lastPlayedDate: null,
  soundVolume: 0.8,
  musicVolume: 0.5,
  completedMissions: [],
  missionProgress: {},

  hydrate: () =>
    set({
      coins: load('coins', 0),
      gems: load('gems', 0),
      ownedSkins: load('ownedSkins', [DEFAULT_SKIN]),
      equippedSkin: load('equippedSkin', DEFAULT_SKIN),
      bestScore: load('bestScore', 0),
      bestDailyScore: load('bestDailyScore', 0),
      streakDays: load('streakDays', 0),
      lastPlayedDate: load('lastPlayedDate', null),
      soundVolume: load('soundVolume', 0.8),
      musicVolume: load('musicVolume', 0.5),
      completedMissions: load('completedMissions', []),
      missionProgress: load('missionProgress', {}),
    }),

  addCoins: (n) =>
    set((s) => {
      const coins = s.coins + n;
      persist({ coins });
      return { coins };
    }),

  spendCoins: (n) => {
    const { coins } = get();
    if (coins < n) return false;
    const remaining = coins - n;
    persist({ coins: remaining });
    set({ coins: remaining });
    return true;
  },

  unlockSkin: (id, cost) => {
    const { coins, ownedSkins } = get();
    if (ownedSkins.includes(id)) return true;
    if (coins < cost) return false;
    const nextCoins = coins - cost;
    const nextOwned = [...ownedSkins, id];
    persist({ coins: nextCoins, ownedSkins: nextOwned });
    set({ coins: nextCoins, ownedSkins: nextOwned });
    return true;
  },

  equipSkin: (id) => {
    persist({ equippedSkin: id });
    set({ equippedSkin: id });
  },

  reportRunEnd: (score, mode = 'endless') =>
    set((s) => {
      const bestScore = mode === 'endless' ? Math.max(s.bestScore, score) : s.bestScore;
      const bestDailyScore = mode === 'daily' ? Math.max(s.bestDailyScore, score) : s.bestDailyScore;
      persist({ bestScore, bestDailyScore });
      return { bestScore, bestDailyScore };
    }),

  claimDailyReward: () => {
    const { lastPlayedDate, streakDays } = get();
    const today = todayKey();
    if (lastPlayedDate === today) return null; // already claimed today

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const continuingStreak = lastPlayedDate === yesterday;
    const nextStreak = continuingStreak ? streakDays + 1 : 1;

    // escalating reward, resets/loops after a 7-day cycle; day 7/30 handled in UI as milestones
    const coinsAwarded = 20 + (nextStreak % 7) * 10;

    const nextCoins = get().coins + coinsAwarded;
    persist({ streakDays: nextStreak, lastPlayedDate: today, coins: nextCoins });
    set({ streakDays: nextStreak, lastPlayedDate: today, coins: nextCoins });

    return { streakDays: nextStreak, coinsAwarded };
  },

  setSoundVolume: (v) => {
    persist({ soundVolume: v });
    set({ soundVolume: v });
  },

  setMusicVolume: (v) => {
    persist({ musicVolume: v });
    set({ musicVolume: v });
  },

  updateMissionProgress: (key, value) => {
    set((s) => {
      const currentVal = s.missionProgress[key] ?? 0;
      const nextProgress = {
        ...s.missionProgress,
        [key]: currentVal + value,
      };
      persist({ missionProgress: nextProgress });
      return { missionProgress: nextProgress };
    });
  },

  claimMissionReward: (id, reward) => {
    set((s) => {
      if (s.completedMissions.includes(id)) return {};
      const completedMissions = [...s.completedMissions, id];
      const coins = s.coins + reward;
      persist({ completedMissions, coins });
      return { completedMissions, coins };
    });
  },
}));
