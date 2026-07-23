import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Skia, Group } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useFrameCallback, useSharedValue, runOnJS } from 'react-native-reanimated';

import { onPressIn, onPressOut, stepPhysics, PHYSICS_CONSTANTS } from '../engine/physics';
import { useRunStore } from '../state/useRunStore';
import { usePlayerStore } from '../state/usePlayerStore';
import { SKINS } from '../data/skins';

const { width: SCREEN_W } = { width: 400 }; // replace with useWindowDimensions in production
const TRACK_VISUAL_WIDTH = SCREEN_W * 0.6;
const BALL_RADIUS = 14;

/**
 * NOTE: This component renders with @shopify/react-native-skia, which requires
 * a custom Expo dev client (`npx expo run:android` / `run:ios` with the skia
 * config plugin) — it will NOT run inside plain Expo Go. See README/architecture
 * doc for the `expo-dev-client` setup step.
 */
export function GameCanvas() {
  const { ball, track, isPlaying, endRun, addCoins, setScore } = useRunStore();
  const equippedSkin = usePlayerStore((s) => s.equippedSkin);
  const skin = useMemo(
    () => SKINS.find((s) => s.id === equippedSkin) ?? SKINS[0],
    [equippedSkin]
  );

  // Rendered position mirrors the physics ball state each frame. In production,
  // ball/track live in shared values updated inside the worklet for zero
  // JS-thread involvement; simplified here to plain refs for clarity.
  const ballX = useSharedValue(0.5);
  const ballY = useSharedValue(0.5);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (!isPlaying || !ball.alive) return;
    const dt = (frameInfo.timeSincePreviousFrame ?? 16) / 1000;
    const now = Date.now();

    stepPhysics(ball, track.getVisibleSegments(), dt, now);
    track.update(ball.distance);

    ballX.value = 0.5 + ball.lateralPos * 0.5;
    ballY.value = 0.6; // ball stays vertically fixed; the track scrolls under it

    if (!ball.alive) {
      // run-ending side effects (state updates, persistence) must hop back to the JS thread
      runOnJS(handleRunEnd)(ball.distance);
    }
  });

  const handleRunEnd = useCallback(
    (distance: number) => {
      const finalScore = Math.floor(distance);
      setScore(finalScore);
      usePlayerStore.getState().reportRunEnd(finalScore);
      usePlayerStore.getState().addCoins(useRunStore.getState().coinsThisRun);
      endRun();
    },
    [endRun, setScore]
  );

  const gesture = Gesture.Manual()
    .onBegin(() => {
      'worklet';
      onPressIn(ball, Date.now());
    })
    .onFinalize(() => {
      'worklet';
      onPressOut(ball, Date.now());
    });

  const trackPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.moveTo(SCREEN_W / 2 - TRACK_VISUAL_WIDTH / 2, 0);
    path.lineTo(SCREEN_W / 2 - TRACK_VISUAL_WIDTH / 2, 800);
    path.moveTo(SCREEN_W / 2 + TRACK_VISUAL_WIDTH / 2, 0);
    path.lineTo(SCREEN_W / 2 + TRACK_VISUAL_WIDTH / 2, 800);
    return path;
  }, []);

  return (
    <View style={styles.fill}>
      <GestureDetector gesture={gesture}>
        <View style={styles.fill}>
          <Canvas style={styles.fill}>
            <Group>
              <Path path={trackPath} color="#2A2E3A" style="stroke" strokeWidth={4} />
              <Circle
                cx={ballX.value * SCREEN_W}
                cy={ballY.value * 800}
                r={BALL_RADIUS}
                color={skin.color}
              />
            </Group>
          </Canvas>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#12141C' },
});
