import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../state/usePlayerStore';
import { useRunStore } from '../state/useRunStore';

interface Props {
  onRetry: () => void;
}

export function RetryOverlay({ onRetry }: Props) {
  const score = useRunStore((s) => s.score);
  const bestScore = usePlayerStore((s) => s.bestScore);
  const isNewBest = score >= bestScore && score > 0;

  return (
    <View style={styles.overlay}>
      <Text style={styles.scoreLabel}>SCORE</Text>
      <Text style={styles.score}>{score}</Text>
      {isNewBest && <Text style={styles.newBest}>✨ New Best!</Text>}

      {/* Positioned in the lower-third so the thumb never has to move after a run ends */}
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>

      {/* Rewarded-ad revive slot — wire to src/monetization/ads.ts in production */}
      <Pressable style={styles.reviveButton} onPress={() => {}}>
        <Text style={styles.reviveText}>▶ Watch ad to revive</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#12141Cee',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  scoreLabel: { color: '#8A8FA3', fontSize: 14, letterSpacing: 2, marginBottom: 4 },
  score: { color: '#EAEAF0', fontSize: 56, fontWeight: '800', marginBottom: 8 },
  newBest: { color: '#FFD54F', fontSize: 16, marginBottom: 24 },
  retryButton: {
    backgroundColor: '#4FD1FF',
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 32,
    marginBottom: 14,
  },
  retryText: { color: '#0B0D12', fontSize: 20, fontWeight: '800' },
  reviveButton: { paddingVertical: 10 },
  reviveText: { color: '#8A8FA3', fontSize: 14 },
});
