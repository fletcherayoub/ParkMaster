import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../state/usePlayerStore';

interface Props {
  onStartGame: () => void;
  onOpenShop: () => void;
}

export function StartMenu({ onStartGame, onOpenShop }: Props) {
  const coins = usePlayerStore((s) => s.coins);
  const bestScore = usePlayerStore((s) => s.bestScore);
  const streakDays = usePlayerStore((s) => s.streakDays);

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.subhead}>HIGHWAY CHASE</Text>
        <Text style={styles.title}>HIGHWAY RUSH</Text>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{bestScore}</Text>
            <Text style={styles.statLabel}>BEST SCORE</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statValue}>{coins.toLocaleString()}</Text>
            <Text style={styles.statLabel}>COINS</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>STREAK</Text>
          </View>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.startBtn} onPress={onStartGame}>
            <Text style={styles.startTxt}>🏎️ START RACE 🏎️</Text>
          </Pressable>

          <Pressable style={styles.shopBtn} onPress={onOpenShop}>
            <Text style={styles.shopTxt}>🎨 GARAGE & CAR SKINS</Text>
          </Pressable>
        </View>

        <Text style={styles.hintTxt}>Drag finger left/right to steer your car and dodge traffic & police</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0D0F17ee',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161926',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292E42',
  },
  subhead: {
    color: '#4FD1FF',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '900',
    marginBottom: 4,
  },
  title: {
    color: '#EAEAF0',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#202436',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D334A',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  statValue: {
    color: '#EAEAF0',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A8FA3',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  startBtn: {
    backgroundColor: '#4FD1FF',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#4FD1FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  startTxt: {
    color: '#0B0D12',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  shopBtn: {
    backgroundColor: '#232838',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#363D54',
  },
  shopTxt: {
    color: '#FFD54F',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hintTxt: {
    color: '#656A7D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
