import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../state/usePlayerStore';
import { useRunStore } from '../state/useRunStore';
import { soundEngine } from '../utils/audio';

interface Props {
  onOpenShop?: () => void;
}

export function HUD({ onOpenShop }: Props) {
  const coins = usePlayerStore((s) => s.coins);
  const streakDays = usePlayerStore((s) => s.streakDays);
  const score = useRunStore((s) => s.score);
  const coinsThisRun = useRunStore((s) => s.coinsThisRun);
  const ball = useRunStore((s) => s.ball);
  const comboMultiplier = useRunStore((s) => s.comboMultiplier);

  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());

  const handleToggleMusic = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <View style={styles.bar}>
      <View style={styles.leftGroup}>
        <View style={[styles.statPill, (ball?.fuel ?? 100) < 25 && styles.fuelCritical]}>
          <Text style={styles.icon}>⛽</Text>
          <Text style={[styles.statVal, (ball?.fuel ?? 100) < 25 && styles.fuelCriticalVal]}>
            {Math.ceil(ball?.fuel ?? 100)}%
          </Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.icon}>🏁</Text>
          <Text style={styles.statVal}>{score}</Text>
          {comboMultiplier > 1 && (
            <Text style={styles.comboTxt}>x{comboMultiplier}</Text>
          )}
        </View>
        <View style={styles.statPill}>
          <Text style={styles.icon}>🪙</Text>
          <Text style={styles.statVal}>{(coins + coinsThisRun).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.rightGroup}>
        {ball?.hasShield && (
          <View style={[styles.badgePill, { backgroundColor: '#4FD1FF22', borderColor: '#4FD1FF' }]}>
            <Text style={styles.badgeTxt}>🛡️ SHIELD</Text>
          </View>
        )}
        {ball?.magnetTimer > 0 && (
          <View style={[styles.badgePill, { backgroundColor: '#B388FF22', borderColor: '#B388FF' }]}>
            <Text style={styles.badgeTxt}>🧲 {Math.ceil(ball.magnetTimer)}s</Text>
          </View>
        )}

        <Pressable style={styles.statPill} onPress={handleToggleMusic}>
          <Text style={styles.icon}>{isMuted ? '🔇' : '🎵'}</Text>
        </Pressable>

        <View style={styles.statPill}>
          <Text style={styles.icon}>🔥</Text>
          <Text style={styles.statVal}>{streakDays}</Text>
        </View>

        {onOpenShop && (
          <Pressable style={styles.shopBtn} onPress={onOpenShop}>
            <Text style={styles.shopTxt}>🎨 GARAGE</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#12141Caa',
  },
  leftGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3247',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  statVal: {
    color: '#EAEAF0',
    fontSize: 14,
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeTxt: {
    color: '#EAEAF0',
    fontSize: 11,
    fontWeight: '900',
  },
  shopBtn: {
    backgroundColor: '#FFD54F',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  shopTxt: {
    color: '#0B0D12',
    fontSize: 12,
    fontWeight: '900',
  },
  comboTxt: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
    textShadowColor: '#FFD54F88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  fuelCritical: {
    borderColor: '#FF1744',
    backgroundColor: '#FF174422',
  },
  fuelCriticalVal: {
    color: '#FF1744',
  },
});
