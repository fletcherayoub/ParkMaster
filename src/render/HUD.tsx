import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../state/usePlayerStore';
import { useRunStore } from '../state/useRunStore';

export function HUD() {
  const coins = usePlayerStore((s) => s.coins);
  const streakDays = usePlayerStore((s) => s.streakDays);
  const score = useRunStore((s) => s.score);
  const coinsThisRun = useRunStore((s) => s.coinsThisRun);

  return (
    <View style={styles.bar} pointerEvents="none">
      <Text style={styles.stat}>🏁 {score}</Text>
      <Text style={styles.stat}>🪙 {coins + coinsThisRun}</Text>
      <Text style={styles.stat}>🔥 {streakDays}</Text>
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
    justifyContent: 'space-around',
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#12141Cdd',
  },
  stat: { color: '#EAEAF0', fontSize: 16, fontWeight: '700' },
});
