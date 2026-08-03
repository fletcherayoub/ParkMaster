import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  data: { streakDays: number; coinsAwarded: number } | null;
  onDismiss: () => void;
}

export function DailyRewardModal({ data, onDismiss }: Props) {
  if (!data) return null;

  return (
    <Modal visible={true} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.badge}>DAILY LOGIN BONUS</Text>
          <Text style={styles.fire}>🔥 Day {data.streakDays} Streak!</Text>

          <View style={styles.rewardBox}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <Text style={styles.rewardAmount}>+{data.coinsAwarded}</Text>
            <Text style={styles.rewardLabel}>COINS AWARDED</Text>
          </View>

          <Pressable style={styles.claimBtn} onPress={onDismiss}>
            <Text style={styles.claimTxt}>CLAIM BONUS</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000bb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1C1F2E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD54F44',
  },
  badge: {
    color: '#8A8FA3',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 6,
  },
  fire: {
    color: '#FF7A59',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  rewardBox: {
    backgroundColor: '#262B3D',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD54F66',
  },
  rewardIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  rewardAmount: {
    color: '#FFD54F',
    fontSize: 36,
    fontWeight: '900',
  },
  rewardLabel: {
    color: '#8A8FA3',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 4,
  },
  claimBtn: {
    backgroundColor: '#FFD54F',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  claimTxt: {
    color: '#0B0D12',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
