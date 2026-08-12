import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text as RNText, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  Group,
  Rect,
  DashPathEffect,
  Image,
  useImage,
  SkImage,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useDerivedValue, SharedValue } from 'react-native-reanimated';

import { SKINS } from '../data/skins';
import { CollisionEvent, onPressIn, onPressOut, stepPhysics, PHYSICS_CONSTANTS, getComboMultiplier } from '../engine/physics';
import { SegmentObstacle } from '../engine/segments/types';
import { usePlayerStore } from '../state/usePlayerStore';
import { useRunStore } from '../state/useRunStore';
import { soundEngine } from '../utils/audio';

const BALL_RADIUS = 16;

// How often (ms) the React-visible score actually updates. The physics
// itself still steps every frame — this only throttles the React re-render
// that displaying the score number causes. 100ms is still visually "live"
// for a counting number but cuts re-renders from ~60/s to ~10/s.
const SCORE_UI_THROTTLE_MS = 100;

interface PopupText {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

/** Crash/busted animation flash overlay type */
type CrashFlashType = null | 'car_crash' | 'busted';

interface CarImages {
  /** Index 0-8 maps to car1…car9 */
  cars: (SkImage | null)[];
  police: SkImage | null;
  bike: SkImage | null;
  fuel: SkImage | null;
  coin: SkImage | null;
  magnet: SkImage | null;
  shield: SkImage | null;
  gem: SkImage | null;
}

interface AnimatedObstacleProps {
  obs: SegmentObstacle;
  segStartDist: number;
  segLength: number;
  scrollDistance: SharedValue<number>;
  SCREEN_W: number;
  SCREEN_H: number;
  carImages: CarImages;
}

function AnimatedObstacle({
  obs,
  segStartDist,
  segLength,
  scrollDistance,
  SCREEN_W,
  SCREEN_H,
  carImages,
}: AnimatedObstacleProps) {
  const [flashState, setFlashState] = useState(0);

  useEffect(() => {
    if (obs.kind !== 'police') return;
    const interval = setInterval(() => {
      setFlashState((prev) => (prev + 1) % 2);
    }, 120);
    return () => clearInterval(interval);
  }, [obs.kind]);

  const obsWorldDist = segStartDist + obs.t * segLength;

  const cy = useDerivedValue(() => {
    const distFromBall = obsWorldDist - scrollDistance.value;
    return SCREEN_H * 0.65 - distFromBall * 1.6;
  });

  const cyOffset = useDerivedValue(() => cy.value + 6);

  let currentX = obs.x;
  if (obs.kind === 'police' && obs.amplitude && obs.speed) {
    const nowMs = Date.now();
    currentX = obs.x + Math.sin(nowMs * 0.0008 * obs.speed) * obs.amplitude;
  }

  const screenX = (0.5 + currentX * 0.5) * SCREEN_W;

  if (obs.collected) return null;

  if (obs.kind === 'coin') {
    const coinImg = carImages.coin;
    const W = 22;
    const H = 22;
    if (coinImg) {
      return (
        <Image
          image={coinImg}
          x={screenX - W / 2}
          y={cy}
          width={W}
          height={H}
          fit="contain"
        />
      );
    }
    return (
      <Group>
        <Circle cx={screenX} cy={cy} r={11} color="#FFD54F" />
        <Circle cx={screenX} cy={cy} r={7} color="#FFA000" />
      </Group>
    );
  } else if (obs.kind === 'gem') {
    const gemImg = carImages.gem;
    const W = 24;
    const H = 24;
    if (gemImg) {
      return (
        <Image
          image={gemImg}
          x={screenX - W / 2}
          y={cy}
          width={W}
          height={H}
          fit="contain"
        />
      );
    }
    return (
      <Group>
        <Circle cx={screenX} cy={cy} r={12} color="#B388FF" />
        <Circle cx={screenX} cy={cy} r={6} color="#7C4DFF" />
      </Group>
    );
  } else if (obs.kind === 'shield') {
    const shieldImg = carImages.shield;
    const W = 26;
    const H = 26;
    if (shieldImg) {
      return (
        <Image
          image={shieldImg}
          x={screenX - W / 2}
          y={cy}
          width={W}
          height={H}
          fit="contain"
        />
      );
    }
    return (
      <Group>
        <Circle cx={screenX} cy={cy} r={13} color="#4FD1FF66" />
        <Circle cx={screenX} cy={cy} r={8} color="#4FD1FF" />
      </Group>
    );
  } else if (obs.kind === 'magnet') {
    const magnetImg = carImages.magnet;
    const W = 26;
    const H = 26;
    if (magnetImg) {
      return (
        <Image
          image={magnetImg}
          x={screenX - W / 2}
          y={cy}
          width={W}
          height={H}
          fit="contain"
        />
      );
    }
    return (
      <Group>
        <Circle cx={screenX} cy={cy} r={13} color="#5CFFB166" />
        <Circle cx={screenX} cy={cy} r={8} color="#5CFFB1" />
      </Group>
    );
  } else if (obs.kind === 'fuel') {
    const fuelImg = carImages.fuel;
    const W = 36;
    const H = 42;
    if (fuelImg) {
      return (
        <Image
          image={fuelImg}
          x={screenX - W / 2}
          y={cy}
          width={W}
          height={H}
          fit="contain"
        />
      );
    }
    return (
      <Group>
        {/* ⛽ Fuel Canister Fallback */}
        <Rect x={screenX - 12} y={cy} width={24} height={28} color="#E53935" />
        <Rect x={screenX - 8} y={cy} width={16} height={20} color="#C62828" />
        <Rect x={screenX - 4} y={cy} width={8} height={5} color="#FFD54F" />
      </Group>
    );
  } else if (obs.kind === 'car') {
    // Pick the variant image (carVariant is 1-9, fallback to 1)
    const variantIdx = ((obs.carVariant ?? 1) - 1) % 9;
    const carImg = carImages.cars[variantIdx];
    const W = 52;
    const H = 72;
    if (carImg) {
      return (
        <Image
          image={carImg}
          x={screenX - W / 2}
          y={cy}
          width={W}
          height={H}
          fit="contain"
        />
      );
    }
    // Fallback while image is loading
    return (
      <Group>
        <Rect x={screenX - 16} y={cy} width={32} height={48} color="#D32F2F" />
        <Rect x={screenX - 12} y={cy} width={24} height={24} color="#1565C0" />
        <Circle cx={screenX - 10} cy={cy} r={3} color="#FFF59D" />
        <Circle cx={screenX + 10} cy={cy} r={3} color="#FFF59D" />
      </Group>
    );
  } else if (obs.kind === 'police') {
    const W = 56;
    const H = 80;
    const policeImg = carImages.police;

    return (
      <Group>
        {policeImg ? (
          <Image
            image={policeImg}
            x={screenX - W / 2}
            y={cy}
            width={W}
            height={H}
            fit="contain"
          />
        ) : (
          <Group>
            <Rect x={screenX - 18} y={cy} width={36} height={52} color="#1A1F2C" />
            <Rect x={screenX - 14} y={cy} width={28} height={28} color="#2196F3" />
          </Group>
        )}
        
        {/* Pulsing sirens on roof */}
        <Circle
          cx={screenX - 6}
          cy={cyOffset}
          r={9}
          color="#FF1744"
          opacity={flashState === 0 ? 0.75 : 0.15}
        />
        <Circle
          cx={screenX + 6}
          cy={cyOffset}
          r={9}
          color="#2979FF"
          opacity={flashState === 1 ? 0.75 : 0.15}
        />
      </Group>
    );
  } else if (obs.kind === 'wall' || obs.kind === 'spike') {
    return <Rect x={screenX - 22} y={cy} width={44} height={16} color="#FF9800" />;
  }

  return null;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color?: string;
}

interface WindLine {
  id: string;
  x: number;
  y: number;
  length: number;
  speed: number;
}

interface Theme {
  bg: string;
  road: string;
  border: string;
  centerLine: string;
}

const THEMES: Theme[] = [
  { bg: '#0D0F17', road: '#161924', border: '#4FD1FF', centerLine: '#3B425E' },
  { bg: '#170E1B', road: '#23162D', border: '#FF7A59', centerLine: '#54366A' },
  { bg: '#0A070E', road: '#110C1A', border: '#FF2A75', centerLine: '#3A1E4A' },
];

export function GameCanvas() {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const TRACK_VISUAL_WIDTH = SCREEN_W * 0.7;

  const isPlaying = useRunStore((s) => s.isPlaying);
  const endRun = useRunStore((s) => s.endRun);
  const setScore = useRunStore((s) => s.setScore);
  const addCoins = useRunStore((s) => s.addCoins);

  const equippedSkin = usePlayerStore((s) => s.equippedSkin);
  const skin = useMemo(() => SKINS.find((s) => s.id === equippedSkin) ?? SKINS[0], [equippedSkin]);
  // Load the player's equipped skin image (bike or any car)
  const playerImg = useImage(skin.image ?? require('../../assets/cars/bike1.png'));

  const ballPx = useSharedValue(SCREEN_W / 2);
  const ballPy = useSharedValue(SCREEN_H * 0.65);
  const scrollDistance = useSharedValue(0);

  const [popups, setPopups] = useState<PopupText[]>([]);
  const [crashFlash, setCrashFlash] = useState<CrashFlashType>(null);
  const [activeSegmentData, setActiveSegmentData] = useState<{
    segments: any[];
    segmentStartDistance: number[];
  }>({ segments: [], segmentStartDistance: [] });

  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [themeIdx, setThemeIdx] = useState(0);
  const themeIdxRef = useRef(0);
  const currentTheme = THEMES[themeIdx];

  // Vehicle steering tilt
  const ballRotation = useSharedValue(0);

  // Hyper-speed Wind Lines
  const [windLines, setWindLines] = useState<WindLine[]>([]);
  const windLinesRef = useRef<WindLine[]>([]);

  const activeSegmentDataRef = useRef(activeSegmentData);
  activeSegmentDataRef.current = activeSegmentData;

  // ─── Preload all car / police sprites via Skia's useImage ───────────────
  const rawCar1 = useImage(require('../../assets/cars/car1.png'));
  const rawCar2 = useImage(require('../../assets/cars/car2.png'));
  const rawCar3 = useImage(require('../../assets/cars/car3.png'));
  const rawCar4 = useImage(require('../../assets/cars/car4.png'));
  const rawCar5 = useImage(require('../../assets/cars/car5.png'));
  const rawCar6 = useImage(require('../../assets/cars/car6.png'));
  const rawCar7 = useImage(require('../../assets/cars/car7.png'));
  const rawCar8 = useImage(require('../../assets/cars/car8.png'));
  const rawCar9 = useImage(require('../../assets/cars/car9.png'));
  const rawPolice = useImage(require('../../assets/cars/policeman.png'));
  const rawBike = useImage(require('../../assets/cars/bike1.png'));
  const rawFuel = useImage(require('../../assets/cars/fuel.png'));
  const rawCoin = useImage(require('../../assets/cars/coin.png'));
  const rawMagnet = useImage(require('../../assets/cars/magnet.png'));
  const rawShield = useImage(require('../../assets/cars/sheald.png'));
  const rawGem = useImage(require('../../assets/cars/gem.png'));

  const carImages = useMemo<CarImages>(
    () => ({
      cars: [rawCar1, rawCar2, rawCar3, rawCar4, rawCar5, rawCar6, rawCar7, rawCar8, rawCar9],
      police: rawPolice,
      bike: rawBike,
      fuel: rawFuel,
      coin: rawCoin,
      magnet: rawMagnet,
      shield: rawShield,
      gem: rawGem,
    }),
    [rawCar1, rawCar2, rawCar3, rawCar4, rawCar5, rawCar6, rawCar7, rawCar8, rawCar9, rawPolice, rawBike, rawFuel, rawCoin, rawMagnet, rawShield, rawGem]
  );

  // Track Borders
  const leftBorderX = SCREEN_W / 2 - TRACK_VISUAL_WIDTH / 2;
  const rightBorderX = SCREEN_W / 2 + TRACK_VISUAL_WIDTH / 2;

  useEffect(() => {
    ballPx.value = SCREEN_W / 2;
    ballPy.value = SCREEN_H * 0.65;
    scrollDistance.value = 0;
    ballRotation.value = 0;
    setParticles([]);
    particlesRef.current = [];
    setThemeIdx(0);
    themeIdxRef.current = 0;

    // Initialize wind lines
    const initialWind = Array.from({ length: 8 }).map((_, i) => ({
      id: `wind-${i}`,
      x: leftBorderX + Math.random() * TRACK_VISUAL_WIDTH,
      y: Math.random() * SCREEN_H,
      length: 40 + Math.random() * 80,
      speed: 350 + Math.random() * 250,
    }));
    setWindLines(initialWind);
    windLinesRef.current = initialWind;
  }, [SCREEN_W, SCREEN_H, ballPx, ballPy, scrollDistance, leftBorderX, TRACK_VISUAL_WIDTH, ballRotation]);

  const triggerPopup = useCallback(
    (text: string, color: string, x: number, y: number) => {
      const newPopup: PopupText = {
        id: Math.random().toString(),
        text,
        color,
        x: Math.max(40, Math.min(SCREEN_W - 40, x)),
        y: y * SCREEN_H - 20,
      };
      setPopups((prev) => [...prev.slice(-4), newPopup]);
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
      }, 850);
    },
    [SCREEN_W, SCREEN_H]
  );

  const handleCollisionEvent = useCallback(
    (event: CollisionEvent) => {
      const screenX = (0.5 + event.x * 0.5) * SCREEN_W;
      
      // Spawn collection pops
      if (event.type === 'coin' || event.type === 'gem' || event.type === 'fuel' || event.type === 'magnet' || event.type === 'shield') {
        const popColor = event.type === 'coin' ? '#FFD54F' : event.type === 'gem' ? '#B388FF' : event.type === 'fuel' ? '#FFA000' : '#4FD1FF';
        const currentParticles = [...particlesRef.current];
        for (let k = 0; k < 6; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 70 + Math.random() * 110;
          currentParticles.push({
            id: Math.random().toString(),
            x: screenX,
            y: SCREEN_H * 0.65,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 50,
            life: 1.0,
            size: 2.5 + Math.random() * 3,
            color: popColor,
          });
        }
        particlesRef.current = currentParticles;
        setParticles(currentParticles);
      }

      if (event.type === 'coin') {
        const multiplier = useRunStore.getState().comboMultiplier;
        addCoins(multiplier);
        soundEngine.playCoinSound();
        triggerPopup(`+${multiplier} 🪙`, '#FFD54F', screenX, 0.65);
      } else if (event.type === 'gem') {
        const multiplier = useRunStore.getState().comboMultiplier;
        addCoins(5 * multiplier);
        soundEngine.playCoinSound();
        triggerPopup(`+${5 * multiplier} 💎`, '#B388FF', screenX, 0.65);
      } else if (event.type === 'fuel') {
        soundEngine.playCoinSound();
        triggerPopup('+45 ⛽ FUEL!', '#FFD54F', screenX, 0.65);
      } else if (event.type === 'police') {
        soundEngine.playCrashSound();
        triggerPopup('BUSTED! 🚓', '#FF1744', screenX, 0.65);
      } else if (event.type === 'shield') {
        soundEngine.playCoinSound();
        triggerPopup('RADAR SHIELD! 🛡️', '#4FD1FF', screenX, 0.65);
      } else if (event.type === 'magnet') {
        soundEngine.playCoinSound();
        triggerPopup('COIN MAGNET! 🧲', '#5CFFB1', screenX, 0.65);
      } else if (event.type === 'shield_break') {
        soundEngine.playCrashSound();
        triggerPopup('SHIELD BROKEN! 💥', '#FF7A59', screenX, 0.65);
      } else if (event.type === 'car_crash') {
        soundEngine.stopBGM();
        soundEngine.playCarCrashSFX();
        setCrashFlash('car_crash');
        triggerPopup('💥 CRASH!', '#FF4444', screenX, 0.65);
      } else if (event.type === 'busted') {
        soundEngine.stopBGM();
        soundEngine.playBustedSFX();
        setCrashFlash('busted');
        triggerPopup('🚨 BUSTED!', '#2979FF', screenX, 0.65);
      } else if (event.type === 'death') {
        soundEngine.stopBGM();
        soundEngine.playCrashSound();
      }
    },
    [addCoins, triggerPopup, SCREEN_W, SCREEN_H]
  );

  const handleRunEnd = useCallback(
    (distance: number) => {
      const finalScore = Math.floor(distance);
      const runMode = useRunStore.getState().runMode;
      const coinsThisRun = useRunStore.getState().coinsThisRun;

      setScore(finalScore);
      usePlayerStore.getState().reportRunEnd(finalScore, runMode);
      usePlayerStore.getState().addCoins(coinsThisRun);

      // Report to missions progress
      const playerStore = usePlayerStore.getState();
      playerStore.updateMissionProgress('distance', finalScore);
      playerStore.updateMissionProgress('coins', coinsThisRun);
      playerStore.updateMissionProgress('score', finalScore);

      // Delay endRun to let the crash/busted animation play
      setTimeout(() => {
        setCrashFlash(null);
        endRun();
      }, 1500);
    },
    [endRun, setScore]
  );

  useEffect(() => {
    if (!isPlaying) {
      soundEngine.stopBGM();
      soundEngine.stopEngine();
      return;
    }

    setCrashFlash(null); // Reset any leftover crash overlay
    soundEngine.startBGM();
    soundEngine.startEngine();

    let animationFrameId: number;
    let lastTime = performance.now();
    let lastScoreInt = 0;
    let lastFirstStartDist = -1;
    let lastScoreUiUpdate = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { ball, track, isPaused } = useRunStore.getState();

      if (ball.alive && !isPaused) {
        soundEngine.startEngine();
        stepPhysics(ball, track.getVisibleSegments(), dt, Date.now(), handleCollisionEvent);
        useRunStore.getState().setComboMultiplier(getComboMultiplier(ball));
        track.update(ball.distance);

        ballPx.value = (0.5 + ball.lateralPos * 0.5) * SCREEN_W;
        scrollDistance.value = ball.distance;

        // Vehicle leaning tilt
        ballRotation.value = Math.max(-0.25, Math.min(0.25, ball.lateralVelocity * 0.05));

        // Pitch shift engine sound based on acceleration/speed
        const speedRatio = ball.forwardSpeed / PHYSICS_CONSTANTS.MAX_FORWARD_SPEED;
        const targetRate = 0.95 + speedRatio * 0.75; // ranges from 0.95 to 1.7
        soundEngine.setEnginePitch(targetRate);

        // Dynamic theme switching based on distance
        const dist = ball.distance;
        let nextIdx = 0;
        if (dist > 1500) {
          nextIdx = 2;
        } else if (dist > 600) {
          nextIdx = 1;
        }
        if (nextIdx !== themeIdxRef.current) {
          themeIdxRef.current = nextIdx;
          setThemeIdx(nextIdx);
        }

        // Particle Trail update
        const currentParticles = [...particlesRef.current];
        for (let i = currentParticles.length - 1; i >= 0; i--) {
          const p = currentParticles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 2.2;
          if (p.life <= 0) {
            currentParticles.splice(i, 1);
          }
        }
        if (Math.random() < 0.45) {
          currentParticles.push({
            id: Math.random().toString(),
            x: ballPx.value + (Math.random() - 0.5) * 8,
            y: ballPy.value + 16,
            vx: (Math.random() - 0.5) * 15,
            vy: ball.forwardSpeed * 0.35 + Math.random() * 20,
            life: 1.0,
            size: 3 + Math.random() * 4,
          });
        }
        particlesRef.current = currentParticles;
        setParticles(currentParticles);

        // Hyper speed wind lines
        if (ball.forwardSpeed > 150) {
          const nextWind = [...windLinesRef.current];
          for (let i = 0; i < nextWind.length; i++) {
            const w = nextWind[i];
            w.y += w.speed * dt * (ball.forwardSpeed / 100);
            if (w.y > SCREEN_H) {
              w.y = -100 - Math.random() * 200;
              w.x = leftBorderX + Math.random() * TRACK_VISUAL_WIDTH;
              w.length = 40 + Math.random() * 80;
              w.speed = 350 + Math.random() * 250;
            }
          }
          windLinesRef.current = nextWind;
          setWindLines(nextWind);
        }

        const scoreInt = Math.floor(ball.distance);
        if (scoreInt !== lastScoreInt && now - lastScoreUiUpdate > SCORE_UI_THROTTLE_MS) {
          lastScoreInt = scoreInt;
          lastScoreUiUpdate = now;
          setScore(scoreInt);
        }

        // Sync segments whenever track generator shifts or adds new segments
        const currentSegs = track.getVisibleSegments();
        const firstStartDist = currentSegs.segmentStartDistance[0] ?? -1;
        if (
          firstStartDist !== lastFirstStartDist ||
          currentSegs.segments.length !== activeSegmentDataRef.current.segments.length
        ) {
          lastFirstStartDist = firstStartDist;
          setActiveSegmentData({
            segments: [...currentSegs.segments],
            segmentStartDistance: [...currentSegs.segmentStartDistance],
          });
        }

        if (!ball.alive) {
          soundEngine.stopEngine();
          handleRunEnd(ball.distance);
          return;
        }
      } else {
        soundEngine.stopEngine();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    // Initial segment sync
    const segs = useRunStore.getState().track.getVisibleSegments();
    setActiveSegmentData({
      segments: [...segs.segments],
      segmentStartDistance: [...segs.segmentStartDistance],
    });

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      soundEngine.stopBGM();
      soundEngine.stopEngine();
    };
  }, [isPlaying, handleRunEnd, handleCollisionEvent, setScore, ballPx, scrollDistance, SCREEN_W, SCREEN_H, leftBorderX, TRACK_VISUAL_WIDTH, ballRotation]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => {
          if (useRunStore.getState().isPaused) return;
          const normX = (e.x / SCREEN_W - 0.5) * 2;
          useRunStore.getState().ball.targetLateralPos = normX;
          onPressIn(useRunStore.getState().ball, Date.now());
        })
        .onUpdate((e) => {
          if (useRunStore.getState().isPaused) return;
          const normX = (e.x / SCREEN_W - 0.5) * 2;
          useRunStore.getState().ball.targetLateralPos = normX;
        })
        .onFinalize(() => {
          if (useRunStore.getState().isPaused) return;
          useRunStore.getState().ball.targetLateralPos = null;
          onPressOut(useRunStore.getState().ball, Date.now());
        }),
    [SCREEN_W]
  );

  const trackBorderPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    builder.moveTo(leftBorderX, 0);
    builder.lineTo(leftBorderX, SCREEN_H);
    builder.moveTo(rightBorderX, 0);
    builder.lineTo(rightBorderX, SCREEN_H);
    return builder.build();
  }, [leftBorderX, rightBorderX, SCREEN_H]);

  const centerLinePath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    builder.moveTo(SCREEN_W / 2, 0);
    builder.lineTo(SCREEN_W / 2, SCREEN_H);
    return builder.build();
  }, [SCREEN_W, SCREEN_H]);

  const roadPhase = useDerivedValue(() => -scrollDistance.value * 1.6);

  const hasShield = useRunStore.getState().ball?.hasShield ?? false;

  const playerTransform = useDerivedValue(() => [
    { translateX: ballPx.value },
    { translateY: ballPy.value },
    { rotate: ballRotation.value },
  ]);

  return (
    <View style={[styles.fill, { backgroundColor: currentTheme.bg }]}>
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>
          <Canvas style={styles.fill}>
            <Rect x={leftBorderX} y={0} width={TRACK_VISUAL_WIDTH} height={SCREEN_H} color={currentTheme.road} />

            <Path path={centerLinePath} color={currentTheme.centerLine} style="stroke" strokeWidth={4}>
              <DashPathEffect intervals={[24, 24]} phase={roadPhase} />
            </Path>

            <Path path={trackBorderPath} color={`${currentTheme.border}33`} style="stroke" strokeWidth={14} />
            <Path path={trackBorderPath} color={currentTheme.border} style="stroke" strokeWidth={4} />

            {activeSegmentData.segments.map((seg, sIdx) => {
              const segStartDist = activeSegmentData.segmentStartDistance[sIdx];
              return seg.obstacles.map((obs: SegmentObstacle, oIdx: number) => (
                <AnimatedObstacle
                  key={`obs-${segStartDist}-${oIdx}`}
                  obs={obs}
                  segStartDist={segStartDist}
                  segLength={seg.length}
                  scrollDistance={scrollDistance}
                  SCREEN_W={SCREEN_W}
                  SCREEN_H={SCREEN_H}
                  carImages={carImages}
                />
              ));
            })}

            {particles.map((p) => (
              <Circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={p.size * p.life}
                color={p.color ?? skin.trailColor}
                opacity={p.life * 0.75}
              />
            ))}

            {/* Wind Speed Lines */}
            {useRunStore.getState().ball.forwardSpeed > 150 && windLines.map((w) => (
              <Rect
                key={w.id}
                x={w.x}
                y={w.y}
                width={1.8}
                height={w.length}
                color="#FFFFFF"
                opacity={0.16 * (useRunStore.getState().ball.forwardSpeed / PHYSICS_CONSTANTS.MAX_FORWARD_SPEED)}
              />
            ))}

            {hasShield && (
              <Circle cx={ballPx} cy={ballPy} r={BALL_RADIUS + 14} color="#4FD1FF55" style="stroke" strokeWidth={3} />
            )}

            {/* Player vehicle Group with rotation matrix */}
            <Group transform={playerTransform}>
              {playerImg ? (
                <Image
                  image={playerImg}
                  x={0}
                  y={0}
                  width={48}
                  height={64}
                  fit="contain"
                  transform={[{ translateX: -24 }, { translateY: -32 }]}
                />
              ) : (
                <Group>
                  <Circle cx={0} cy={0} r={BALL_RADIUS + 3} color={skin.glowColor} />
                  <Circle cx={0} cy={0} r={BALL_RADIUS} color={skin.color} />
                  <Circle cx={0} cy={0} r={BALL_RADIUS - 6} color="#FFFFFFaa" />
                </Group>
              )}
            </Group>
          </Canvas>

          {popups.map((popup) => (
            <View
              key={popup.id}
              style={[styles.popupTextContainer, { left: popup.x - 50, top: popup.y }]}
              pointerEvents="none"
            >
              <RNText style={[styles.popupText, { color: popup.color }]}>{popup.text}</RNText>
            </View>
          ))}

          {/* ─── Crash / Busted overlay animation ─── */}
          {crashFlash === 'car_crash' && (
            <View style={styles.crashOverlay} pointerEvents="none">
              <View style={styles.crashFlashRed} />
              <View style={styles.crashContent}>
                <RNText style={styles.crashEmoji}>💥</RNText>
                <RNText style={styles.crashTitle}>CRASH!</RNText>
                <RNText style={styles.crashSubtitle}>You hit a vehicle</RNText>
              </View>
            </View>
          )}

          {crashFlash === 'busted' && (
            <View style={styles.crashOverlay} pointerEvents="none">
              <View style={styles.bustedFlash} />
              <View style={styles.crashContent}>
                <RNText style={styles.bustedEmoji}>🚨</RNText>
                <RNText style={styles.bustedTitle}>BUSTED!</RNText>
                <RNText style={styles.crashSubtitle}>Police caught you</RNText>
              </View>
            </View>
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0D0F17' },
  popupTextContainer: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  popupText: {
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: '#00000088',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // ─── Crash / Busted overlay styles ───
  crashOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  crashFlashRed: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 20, 20, 0.45)',
  },
  bustedFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(41, 121, 255, 0.4)',
  },
  crashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crashEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  crashTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF4444',
    letterSpacing: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  bustedEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  bustedTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#2979FF',
    letterSpacing: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  crashSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EAEAF0',
    marginTop: 8,
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
});