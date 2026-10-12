import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, InterstitialAd, RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';

import { DailyRewardModal } from '@/render/DailyRewardModal';
import { GameCanvas } from '@/render/GameCanvas';
import { HUD } from '@/render/HUD';
import { PauseOverlay } from '@/render/PauseOverlay';
import { RetryOverlay } from '@/render/RetryOverlay';
import { SkinShopModal } from '@/render/SkinShopModal';
import { StartMenu } from '@/render/StartMenu';
import { useDailyReward } from '@/state/useDailyReward';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useRunStore } from '@/state/useRunStore';
import { AD_UNITS } from '@/utils/ads';

const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial, {
  requestNonPersonalizedAdsOnly: true,
});

const continueRewardedAd = RewardedAd.createForAdRequest(AD_UNITS.rewarded, {
  requestNonPersonalizedAdsOnly: true,
});

export default function GameScreen() {
  const isPlaying = useRunStore((s) => s.isPlaying);
  const isPaused = useRunStore((s) => s.isPaused);
  const runMode = useRunStore((s) => s.runMode);
  const startRun = useRunStore((s) => s.startRun);
  const continueRun = useRunStore((s) => s.continueRun);
  const endRun = useRunStore((s) => s.endRun);
  const setPaused = useRunStore((s) => s.setPaused);
  const hydrate = usePlayerStore((s) => s.hydrate);

  const { popup, dismiss } = useDailyReward();
  const [shopVisible, setShopVisible] = useState(false);
  const [hasStartedFirstRun, setHasStartedFirstRun] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);
  const [hasContinuedThisRun, setHasContinuedThisRun] = useState(false);

  useEffect(() => {
    hydrate();

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setInterstitialLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      interstitial.load();
    });

    interstitial.load();

    // Setup Rewarded Ad for Continuing game
    const unsubscribeRewardedLoaded = continueRewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setRewardedLoaded(true);
    });

    const unsubscribeRewardedEarned = continueRewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setHasContinuedThisRun(true);
        continueRun();
      }
    );

    const unsubscribeRewardedClosed = continueRewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setRewardedLoaded(false);
      continueRewardedAd.load();
    });

    continueRewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeRewardedLoaded();
      unsubscribeRewardedEarned();
      unsubscribeRewardedClosed();
    };
  }, []);

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

  const hasCompletedTutorial = usePlayerStore((s) => s.hasCompletedTutorial);

  const handleStartGame = () => {
    setHasStartedFirstRun(true);
    setHasContinuedThisRun(false);
    startRun('endless');
  };

  const handleStartDailyGame = () => {
    setHasStartedFirstRun(true);
    setHasContinuedThisRun(false);
    startRun('daily');
  };

  const handleRetryGame = () => {
    if (interstitialLoaded) {
      interstitial.show();
    }
    setHasStartedFirstRun(true);
    setHasContinuedThisRun(false);
    startRun(runMode);
  };

  const handleContinueWithAd = () => {
    if (rewardedLoaded) {
      continueRewardedAd.show();
    }
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
          onContinue={handleContinueWithAd}
          canContinue={rewardedLoaded && !hasContinuedThisRun}
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

      {!isPlaying && (
        <View style={styles.adBannerContainer}>
          <BannerAd
            unitId={AD_UNITS.banner}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0D0F17' },
  adBannerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
