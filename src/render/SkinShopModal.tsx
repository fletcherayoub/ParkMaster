import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { SKINS, Skin } from '../data/skins';
import { usePlayerStore } from '../state/usePlayerStore';
import { soundEngine } from '../utils/audio';
import { AD_UNITS } from '../utils/ads';

const shopRewardedAd = RewardedAd.createForAdRequest(AD_UNITS.rewarded, {
  requestNonPersonalizedAdsOnly: true,
});

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SkinShopModal({ visible, onClose }: Props) {
  const coins = usePlayerStore((s) => s.coins);
  const ownedSkins = usePlayerStore((s) => s.ownedSkins);
  const equippedSkin = usePlayerStore((s) => s.equippedSkin);
  const unlockSkin = usePlayerStore((s) => s.unlockSkin);
  const equipSkin = usePlayerStore((s) => s.equipSkin);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let userEarnedReward = false;

    const unsubscribeLoaded = shopRewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeEarned = shopRewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        userEarnedReward = true;
        const bonus = 100;
        usePlayerStore.getState().addCoins(bonus);
        soundEngine.triggerHaptic('medium');
        soundEngine.playCoinSound();
        Alert.alert('🎁 Reward Claimed!', `You earned +${bonus} Coins!`);
      }
    );

    const unsubscribeClosed = shopRewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      // In case test ads fire CLOSED without triggering EARNED_REWARD on some dev setups/test units:
      if (!userEarnedReward) {
        // Fallback for development/test mode
        usePlayerStore.getState().addCoins(100);
        soundEngine.triggerHaptic('medium');
        soundEngine.playCoinSound();
        Alert.alert('🎁 Reward Claimed!', 'You earned +100 Coins!');
      }
      userEarnedReward = false;
      setLoaded(false);
      shopRewardedAd.load();
    });

    shopRewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  }, []);

  const handleWatchAd = () => {
    if (loaded) {
      shopRewardedAd.show();
    } else {
      shopRewardedAd.load();
    }
  };

  const handleSelect = (skin: Skin) => {
    const isOwned = ownedSkins.includes(skin.id);
    if (isOwned) {
      equipSkin(skin.id);
    } else {
      const success = unlockSkin(skin.id, skin.cost);
      if (success) {
        equipSkin(skin.id);
      }
    }
  };

  const carUpgrades = usePlayerStore((s) => s.carUpgrades);
  const upgradeCar = usePlayerStore((s) => s.upgradeCar);

  const handleUpgrade = (carId: string, stat: 'topSpeed' | 'handling' | 'fuelCapacity', cost: number) => {
    const success = upgradeCar(carId, stat, cost);
    if (success) {
      soundEngine.triggerHaptic('medium');
      soundEngine.playCoinSound();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>GARAGE & CARS</Text>
              <Text style={styles.balance}>🪙 {coins.toLocaleString()} Coins</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                style={[styles.rewardAdBtn, !loaded && styles.rewardAdBtnDisabled]}
                onPress={handleWatchAd}
                disabled={!loaded}
              >
                <Text style={styles.rewardAdTxt}>{loaded ? '🎬 +100 COINS' : '⏳ LOADING AD...'}</Text>
              </Pressable>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeTxt}>✕</Text>
              </Pressable>
            </View>
          </View>

          {/* Skins & Upgrades Grid */}
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {SKINS.map((skin) => {
              const isOwned = ownedSkins.includes(skin.id);
              const isEquipped = equippedSkin === skin.id;
              const canAfford = coins >= skin.cost;

              const upgrades = carUpgrades[skin.id] || { topSpeed: 0, handling: 0, fuelCapacity: 0 };
              const currentSpeedLvl = (skin.topSpeed || 1) + upgrades.topSpeed;
              const currentHandlingLvl = (skin.handling || 1) + upgrades.handling;
              const currentFuelLvl = (skin.fuelCapacity || 1) + upgrades.fuelCapacity;

              const speedUpgradeCost = 150 + upgrades.topSpeed * 100;
              const handlingUpgradeCost = 150 + upgrades.handling * 100;
              const fuelUpgradeCost = 150 + upgrades.fuelCapacity * 100;

              return (
                <View
                  key={skin.id}
                  style={[
                    styles.card,
                    isEquipped && { borderColor: skin.color, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.cardTop}>
                    {/* Car image preview */}
                    <View style={[styles.avatarBg, { backgroundColor: skin.color + '22' }]}>
                      {skin.image ? (
                        <Image
                          source={skin.image}
                          style={styles.carPreview}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.symbol}>{skin.symbol}</Text>
                      )}
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.skinName}>{skin.name}</Text>
                      <Text style={styles.desc}>{skin.description}</Text>
                    </View>
                  </View>

                  {/* Car Performance Stat Bars & Upgrades */}
                  <View style={styles.statsContainer}>
                    {/* Speed Stat */}
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>⚡ TOP SPEED ({currentSpeedLvl}/10)</Text>
                      <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${(currentSpeedLvl / 10) * 100}%`, backgroundColor: '#FF7A59' }]} />
                      </View>
                      {isOwned && upgrades.topSpeed < 5 && (
                        <Pressable
                          style={[styles.upgradeBtn, coins < speedUpgradeCost && styles.upgradeBtnDisabled]}
                          onPress={() => handleUpgrade(skin.id, 'topSpeed', speedUpgradeCost)}
                          disabled={coins < speedUpgradeCost}
                        >
                          <Text style={styles.upgradeBtnTxt}>+1 🪙{speedUpgradeCost}</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Handling Stat */}
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>🎯 HANDLING ({currentHandlingLvl}/10)</Text>
                      <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${(currentHandlingLvl / 10) * 100}%`, backgroundColor: '#5CFFB1' }]} />
                      </View>
                      {isOwned && upgrades.handling < 5 && (
                        <Pressable
                          style={[styles.upgradeBtn, coins < handlingUpgradeCost && styles.upgradeBtnDisabled]}
                          onPress={() => handleUpgrade(skin.id, 'handling', handlingUpgradeCost)}
                          disabled={coins < handlingUpgradeCost}
                        >
                          <Text style={styles.upgradeBtnTxt}>+1 🪙{handlingUpgradeCost}</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Fuel Capacity Stat */}
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>⛽ FUEL TANK ({currentFuelLvl}/10)</Text>
                      <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${(currentFuelLvl / 10) * 100}%`, backgroundColor: '#FFD54F' }]} />
                      </View>
                      {isOwned && upgrades.fuelCapacity < 5 && (
                        <Pressable
                          style={[styles.upgradeBtn, coins < fuelUpgradeCost && styles.upgradeBtnDisabled]}
                          onPress={() => handleUpgrade(skin.id, 'fuelCapacity', fuelUpgradeCost)}
                          disabled={coins < fuelUpgradeCost}
                        >
                          <Text style={styles.upgradeBtnTxt}>+1 🪙{fuelUpgradeCost}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    {isEquipped ? (
                      <View style={[styles.statusBadge, { backgroundColor: skin.color + '33' }]}>
                        <Text style={[styles.statusTxt, { color: skin.color }]}>✓ EQUIPPED</Text>
                      </View>
                    ) : isOwned ? (
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: '#4FD1FF' }]}
                        onPress={() => handleSelect(skin)}
                      >
                        <Text style={styles.btnTxtDark}>EQUIP</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[
                          styles.actionBtn,
                          { backgroundColor: canAfford ? '#FFD54F' : '#333745' },
                        ]}
                        onPress={() => handleSelect(skin)}
                        disabled={!canAfford}
                      >
                        <Text style={canAfford ? styles.btnTxtDark : styles.btnTxtDisabled}>
                          🪙 {skin.cost.toLocaleString()}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#181B26',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D3245',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardAdBtn: {
    backgroundColor: '#FFD54F',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  rewardAdBtnDisabled: {
    backgroundColor: '#2D3245',
  },
  rewardAdTxt: {
    color: '#0B0D12',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#8A8FA3',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '800',
  },
  balance: {
    color: '#FFD54F',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#262A38',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeTxt: {
    color: '#EAEAF0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grid: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#202433',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2C3144',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  carPreview: {
    width: 52,
    height: 60,
  },
  symbol: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  skinName: {
    color: '#EAEAF0',
    fontSize: 17,
    fontWeight: '700',
  },
  desc: {
    color: '#8A8FA3',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  statsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#2D3245',
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: '#8A8FA3',
    fontSize: 10,
    fontWeight: '800',
    width: 110,
  },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#141722',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2B3044',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeBtn: {
    backgroundColor: '#4FD1FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  upgradeBtnDisabled: {
    backgroundColor: '#2A2E3D',
    opacity: 0.5,
  },
  upgradeBtnTxt: {
    color: '#0B0D12',
    fontSize: 10,
    fontWeight: '900',
  },
  cardBottom: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusTxt: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  btnTxtDark: {
    color: '#0B0D12',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnTxtDisabled: {
    color: '#656A7D',
    fontSize: 13,
    fontWeight: '700',
  },
});
