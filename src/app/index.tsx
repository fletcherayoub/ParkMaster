import React, { useEffect, useState } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';

import { GameCanvas } from '@/render/GameCanvas';
import { HUD } from '@/render/HUD';
import { StartMenu } from '@/render/StartMenu';
import { RetryOverlay } from '@/render/RetryOverlay';
import { SkinShopModal } from '@/render/SkinShopModal';
import { DailyRewardModal } from '@/render/DailyRewardModal';
import { PauseOverlay } from '@/render/PauseOverlay';
import { useRunStore } from '@/state/useRunStore';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useDailyReward } from '@/state/useDailyReward';

export default function GameScreen() {
  const isPlaying = useRunStore((s) => s.isPlaying);
  const isPaused = useRunStore((s) => s.isPaused);
  const runMode = useRunStore((s) => s.runMode);
  const startRun = useRunStore((s) => s.startRun);
  const endRun = useRunStore((s) => s.endRun);
  const setPaused = useRunStore((s) => s.setPaused);
  const hydrate = usePlayerStore((s) => s.hydrate);
  
  const { popup, dismiss } = useDailyReward();
  const [shopVisible, setShopVisible] = useState(false);
  const [hasStartedFirstRun, setHasStartedFirstRun] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Hook into the phone's back button
  useEffect(() => {
    const handleBackButton = () => {
      if (isPlaying) {
        // If the game is playing, intercept the back press to toggle pause state
        setPaused(!isPaused);
        return true; // prevent default behavior (quitting the app)
      }
      return false; // let default behavior happen if not in a run
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => {
      subscription.remove();
    };
  }, [isPlaying, isPaused, setPaused]);



  const handleStartGame = () => {
    setHasStartedFirstRun(true);
    startRun('endless');
  };

  const handleStartDailyGame = () => {
    setHasStartedFirstRun(true);
    startRun('daily');
  };

  const handleRetryGame = () => {
    setHasStartedFirstRun(true);
    startRun(runMode);
  };

  const handleResume = () => {
    setPaused(false);
  };

  const handleQuit = () => {
    endRun();
  };

  return (
    <View style={styles.fill}>
      <GameCanvas />
      
      {isPlaying && <HUD onOpenShop={() => setShopVisible(true)} />}

      {!hasStartedFirstRun && !isPlaying && (
        <StartMenu
          onStartGame={handleStartGame}
          onStartDailyGame={handleStartDailyGame}
          onOpenShop={() => setShopVisible(true)}
        />
      )}

      {hasStartedFirstRun && !isPlaying && (
        <RetryOverlay
          onRetry={handleRetryGame}
          onOpenShop={() => setShopVisible(true)}
        />
      )}

      <SkinShopModal
        visible={shopVisible}
        onClose={() => setShopVisible(false)}
      />

      <DailyRewardModal
        data={popup}
        onDismiss={dismiss}
      />

      <PauseOverlay
        visible={isPlaying && isPaused}
        onResume={handleResume}
        onQuit={handleQuit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0D0F17' },
});
