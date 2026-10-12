import { create } from 'zustand';
import { BallState, createInitialBallState, reviveBallState, PHYSICS_CONSTANTS } from '../engine/physics';
import { TrackGenerator } from '../engine/trackGenerator';
import { SKINS } from '../data/skins';
import { usePlayerStore } from './usePlayerStore';

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

  startRun: (mode) => {
    const { equippedSkin, carUpgrades } = usePlayerStore.getState();
    const skin = SKINS.find((s) => s.id === equippedSkin) ?? SKINS[0];
    const upgrades = carUpgrades[equippedSkin] || { topSpeed: 0, handling: 0, fuelCapacity: 0 };

    const totalTopSpeedLvl = (skin.topSpeed || 1) + upgrades.topSpeed;
    const totalHandlingLvl = (skin.handling || 1) + upgrades.handling;
    const totalFuelLvl = (skin.fuelCapacity || 1) + upgrades.fuelCapacity;

    const initialBall = createInitialBallState();
    // Speed bonus: +12 speed per stat level
    initialBall.forwardSpeed = PHYSICS_CONSTANTS.BASE_FORWARD_SPEED + totalTopSpeedLvl * 12;
    // Fuel Capacity bonus: +15 max fuel capacity per stat level
    initialBall.fuel = 100 + totalFuelLvl * 15;

    set({
      ball: initialBall,
      track: mode === 'daily' ? TrackGenerator.daily() : TrackGenerator.endless(),
      coinsThisRun: 0,
      score: 0,
      isPlaying: true,
      isPaused: false,
      runMode: mode,
      comboMultiplier: 1,
    });
  },

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
