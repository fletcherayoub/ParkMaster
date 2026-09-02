import { create } from 'zustand';
import { BallState, createInitialBallState, reviveBallState } from '../engine/physics';
import { TrackGenerator } from '../engine/trackGenerator';

interface RunState {
  ball: BallState;
  track: TrackGenerator;
  coinsThisRun: number;
  score: number;
  isPlaying: boolean;
  isPaused: boolean;
  runMode: 'endless' | 'daily';
  comboMultiplier: number;

  startRun: (mode: 'endless' | 'daily') => void;
  continueRun: () => void;
  endRun: () => void;
  addCoins: (n: number) => void;
  setScore: (n: number) => void;
  setPaused: (paused: boolean) => void;
  setComboMultiplier: (m: number) => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  ball: createInitialBallState(),
  track: TrackGenerator.endless(),
  coinsThisRun: 0,
  score: 0,
  isPlaying: false,
  isPaused: false,
  runMode: 'endless',
  comboMultiplier: 1,

  startRun: (mode) =>
    set({
      ball: createInitialBallState(),
      track: mode === 'daily' ? TrackGenerator.daily() : TrackGenerator.endless(),
      coinsThisRun: 0,
      score: 0,
      isPlaying: true,
      isPaused: false,
      runMode: mode,
      comboMultiplier: 1,
    }),

  continueRun: () =>
    set((s) => ({
      ball: reviveBallState(s.ball),
      isPlaying: true,
      isPaused: false,
    })),

  endRun: () => set({ isPlaying: false, isPaused: false }),

  addCoins: (n) => set((s) => ({ coinsThisRun: s.coinsThisRun + n })),

  setScore: (n) => set({ score: n }),

  setPaused: (paused) => set({ isPaused: paused }),

  setComboMultiplier: (m) => set({ comboMultiplier: m }),
}));
