import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../state/usePlayerStore';
import { useRunStore } from '../state/useRunStore';

interface Props {
  onRetry: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  onOpenShop?: () => void;
}

export function RetryOverlay({ onRetry, onContinue, canContinue = true, onOpenShop }: Props) {
  const score = useRunStore((s) => s.score);
  const coinsThisRun = useRunStore((s) => s.coinsThisRun);
  const bestScore = usePlayerStore((s) => s.bestScore);
  const isNewBest = score >= bestScore && score > 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.contentCard}>
        <Text style={styles.titleHeader}>RUN COMPLETE</Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.score}>{score}</Text>
          {isNewBest && <Text style={styles.newBest}>✨ NEW HIGH SCORE! ✨</Text>}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statNum}>+{coinsThisRun}</Text>
            <Text style={styles.statTag}>COINS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statNum}>{bestScore}</Text>
            <Text style={styles.statTag}>BEST</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {onContinue && canContinue && (
            <Pressable style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueText}>🎬 WATCH AD TO CONTINUE</Text>
            </Pressable>
          )}

          <Pressable style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>PLAY AGAIN</Text>
          </Pressable>

          {onOpenShop && (
            <Pressable style={styles.shopButton} onPress={onOpenShop}>
              <Text style={styles.shopText}>🎨 GARAGE</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0B0D14dd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161926',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292E42',
  },
  titleHeader: {
    color: '#8A8FA3',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: { color: '#656A7D', fontSize: 13, letterSpacing: 2, fontWeight: '700' },
  score: { color: '#EAEAF0', fontSize: 64, fontWeight: '900', marginVertical: 4 },
  newBest: { color: '#FFD54F', fontSize: 14, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#202436',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D334A',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statNum: { color: '#EAEAF0', fontSize: 20, fontWeight: '800' },
  statTag: { color: '#8A8FA3', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  actionRow: {
    width: '100%',
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#FFD54F',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 4,
  },
  continueText: { color: '#0B0D12', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  retryButton: {
    backgroundColor: '#4FD1FF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  retryText: { color: '#0B0D12', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  shopButton: {
    backgroundColor: '#232838',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#363D54',
  },
  shopText: { color: '#FFD54F', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
