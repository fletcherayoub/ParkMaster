import { create } from 'zustand';
import { BallState, createInitialBallState } from '../engine/physics';
import { TrackGenerator } from '../engine/trackGenerator';

interface RunState {
  ball: BallState;
  track: TrackGenerator;
  coinsThisRun: number;
  score: number;
  isPlaying: boolean;
  isPaused: boolean;

  startRun: (mode: 'endless' | 'daily') => void;
  endRun: () => void;
  addCoins: (n: number) => void;
  setScore: (n: number) => void;
  setPaused: (paused: boolean) => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  ball: createInitialBallState(),
  track: TrackGenerator.endless(),
  coinsThisRun: 0,
  score: 0,
  isPlaying: false,
  isPaused: false,

  startRun: (mode) =>
    set({
      ball: createInitialBallState(),
      track: mode === 'daily' ? TrackGenerator.daily() : TrackGenerator.endless(),
      coinsThisRun: 0,
      score: 0,
      isPlaying: true,
      isPaused: false,
    }),

  endRun: () => set({ isPlaying: false, isPaused: false }),

  addCoins: (n) => set((s) => ({ coinsThisRun: s.coinsThisRun + n })),

  setScore: (n) => set({ score: n }),

  setPaused: (paused) => set({ isPaused: paused }),
}));
