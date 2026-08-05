import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../state/usePlayerStore';
import { useRunStore } from '../state/useRunStore';

interface Props {
  onRetry: () => void;
  onOpenShop?: () => void;
}

export function RetryOverlay({ onRetry, onOpenShop }: Props) {
  const score = useRunStore((s) => s.score);
  const coinsThisRun = useRunStore((s) => s.coinsThisRun);
  const bestScore = usePlayerStore((s) => s.bestScore);
  const deathReason = useRunStore((s) => s.deathReason);
  const isNewBest = score >= bestScore && score > 0;

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [confetti, setConfetti] = useState<Array<{ id: string; x: number; y: number; emoji: string }>>([]);

  // Trigger opening animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulsing animation for new high score
    if (isNewBest) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Generate confetti
      const emojis = ['🎉', '⭐', '🏆', '✨', '🎊', '💫', '🌟'];
      const newConfetti = Array.from({ length: 20 }, (_, i) => ({
        id: `confetti-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      }));
      setConfetti(newConfetti);

      return () => pulseLoop.stop();
    }
  }, [isNewBest, fadeAnim, scaleAnim, pulseAnim]);

  // Determine title and icon based on death reason
  const getTitleAndIcon = () => {
    switch (deathReason) {
      case 'fuel':
        return { title: 'OUT OF FUEL', icon: '⛽' };
      case 'busted':
        return { title: 'BUSTED', icon: '🚓' };
      case 'crash':
        return { title: 'CRASHED', icon: '💥' };
      default:
        return { title: 'RUN COMPLETE', icon: '🏁' };
    }
  };

  const { title, icon } = getTitleAndIcon();

  return (
    <View style={styles.overlay}>
      {/* Confetti for new high score */}
      {isNewBest && confetti.map((item) => (
        <Animated.Text
          key={item.id}
          style={[
            styles.confetti,
            {
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: fadeAnim,
            },
          ]}
        >
          {item.emoji}
        </Animated.Text>
      ))}

      <Animated.View
        style={[
          styles.contentCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.titleHeader}>{icon} {title}</Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Animated.Text
            style={[
              styles.score,
              isNewBest && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            {score}
          </Animated.Text>
          {isNewBest && (
            <View style={styles.newBestContainer}>
              <Text style={styles.newBestTitle}>🎉 NEW HIGH SCORE! 🎉</Text>
              <Text style={styles.newBestSubtitle}>You beat your previous record of {bestScore}!</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, isNewBest && styles.statBoxHighlight]}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statNum}>+{coinsThisRun}</Text>
            <Text style={styles.statTag}>COINS</Text>
          </View>
          <View style={[styles.statBox, isNewBest && styles.statBoxHighlight]}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statNum}>{bestScore}</Text>
            <Text style={styles.statTag}>BEST</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.retryButton, isNewBest && styles.retryButtonHighlight]} onPress={onRetry}>
            <Text style={styles.retryText}>PLAY AGAIN</Text>
          </Pressable>

          {onOpenShop && (
            <Pressable style={styles.shopButton} onPress={onOpenShop}>
              <Text style={styles.shopText}>🎨 GARAGE</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
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
  confetti: {
    position: 'absolute',
    fontSize: 28,
    zIndex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
  newBestContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  newBestTitle: {
    color: '#FFD54F',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#FFD54F',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  newBestSubtitle: {
    color: '#8A8FA3',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
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
  statBoxHighlight: {
    backgroundColor: '#2A2F44',
    borderColor: '#FFD54F',
    borderWidth: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statNum: { color: '#EAEAF0', fontSize: 20, fontWeight: '800' },
  statTag: { color: '#8A8FA3', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  actionRow: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#4FD1FF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  retryButtonHighlight: {
    backgroundColor: '#FFD54F',
    shadowColor: '#FFD54F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
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
