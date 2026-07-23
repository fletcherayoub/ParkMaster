import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { GameCanvas } from '@/render/GameCanvas';
import { HUD } from '@/render/HUD';
import { RetryOverlay } from '@/render/RetryOverlay';
import { useRunStore } from '@/state/useRunStore';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useDailyReward } from '@/state/useDailyReward';

/**
 * The app opens directly into gameplay — no menu, no start button.
 * This matches the "learnable in under 30 seconds" requirement: the
 * first thing a new player sees IS the game, already charging on touch.
 */
export default function GameScreen() {
  const isPlaying = useRunStore((s) => s.isPlaying);
  const startRun = useRunStore((s) => s.startRun);
  const hydrate = usePlayerStore((s) => s.hydrate);
  const { popup, dismiss } = useDailyReward();

  useEffect(() => {
    hydrate();
    startRun('endless');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.fill}>
      <GameCanvas />
      <HUD />
      {!isPlaying && <RetryOverlay onRetry={() => startRun('endless')} />}
      {popup && (
        <View style={styles.dailyPopup}>
          {/* Minimal placeholder — swap for a proper animated modal/component */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#12141C' },
  dailyPopup: { position: 'absolute', top: 100, alignSelf: 'center' },
});
