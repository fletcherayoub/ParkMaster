import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MISSIONS } from '../data/missions';
import { usePlayerStore } from '../state/usePlayerStore';
import { soundEngine } from '../utils/audio';

interface Props {
  onStartGame: () => void;
  onStartDailyGame: () => void;
  onOpenShop: () => void;
}

export function StartMenu({ onStartGame, onStartDailyGame, onOpenShop }: Props) {
  const coins = usePlayerStore((s) => s.coins);
  const bestScore = usePlayerStore((s) => s.bestScore);
  const bestDailyScore = usePlayerStore((s) => s.bestDailyScore);
  const streakDays = usePlayerStore((s) => s.streakDays);

  const soundVolume = usePlayerStore((s) => s.soundVolume);
  const musicVolume = usePlayerStore((s) => s.musicVolume);
  const setSoundVolume = usePlayerStore((s) => s.setSoundVolume);
  const setMusicVolume = usePlayerStore((s) => s.setMusicVolume);

  const completedMissions = usePlayerStore((s) => s.completedMissions);
  const missionProgress = usePlayerStore((s) => s.missionProgress);
  const claimMissionReward = usePlayerStore((s) => s.claimMissionReward);

  const [activeTab, setActiveTab] = useState<'race' | 'missions' | 'settings'>('race');

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [titleScaleAnim] = useState(new Animated.Value(0.8));

  // Opening animation
  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(titleScaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSoundVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    soundEngine.updateVolumeSettings(undefined, vol);
  };

  const handleMusicVolumeChange = (vol: number) => {
    setMusicVolume(vol);
    soundEngine.updateVolumeSettings(vol, undefined);
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Title Group */}
        <Animated.Text style={[styles.subhead, { transform: [{ scale: titleScaleAnim }] }]}>
          HIGHWAY CHASE
        </Animated.Text>
        <Animated.Text style={[styles.title, { transform: [{ scale: titleScaleAnim }] }]}>
          HIGHWAY RUSH
        </Animated.Text>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'race' && styles.tabActive]}
            onPress={() => setActiveTab('race')}
          >
            <Text style={[styles.tabTxt, activeTab === 'race' && styles.tabTxtActive]}>🏎️ RACE</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'missions' && styles.tabActive]}
            onPress={() => setActiveTab('missions')}
          >
            <Text style={[styles.tabTxt, activeTab === 'missions' && styles.tabTxtActive]}>🏆 MISSIONS</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'settings' && styles.tabActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabTxt, activeTab === 'settings' && styles.tabTxtActive]}>⚙️ SETTINGS</Text>
          </Pressable>
        </View>

        {activeTab === 'race' && (
          <View style={styles.body}>
            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🏆</Text>
                <Text style={styles.statValue}>{bestScore}</Text>
                <Text style={styles.statLabel}>BEST</Text>
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

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable style={styles.startBtn} onPress={onStartGame}>
                <Text style={styles.startTxt}>🏎️ ENDLESS MODE 🏎️</Text>
              </Pressable>

              <Pressable style={styles.dailyBtn} onPress={onStartDailyGame}>
                <Text style={styles.dailyTxt}>🏁 DAILY CHALLENGE 🏁</Text>
                {bestDailyScore > 0 && <Text style={styles.dailyBestTxt}>Daily Best: {bestDailyScore}</Text>}
              </Pressable>

              <Pressable style={styles.shopBtn} onPress={onOpenShop}>
                <Text style={styles.shopTxt}>🎨 GARAGE & CAR SKINS</Text>
              </Pressable>
            </View>

            <Text style={styles.hintTxt}>Drag left/right to steer and dodge traffic & police!</Text>
          </View>
        )}

        {activeTab === 'missions' && (
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {MISSIONS.map((m) => {
              const progVal = missionProgress[m.targetKey] ?? 0;
              const isDone = progVal >= m.targetValue;
              const isClaimed = completedMissions.includes(m.id);
              const progressFraction = Math.min(progVal / m.targetValue, 1);

              return (
                <View key={m.id} style={styles.missionCard}>
                  <View style={styles.missionHeader}>
                    <Text style={styles.missionTitle}>{m.name}</Text>
                    <Text style={styles.missionReward}>🪙 +{m.reward}</Text>
                  </View>
                  <Text style={styles.missionDesc}>{m.description}</Text>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progressFraction * 100}%` }]} />
                    </View>
                    <Text style={styles.progressTxt}>
                      {progVal.toLocaleString()} / {m.targetValue.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.missionFooter}>
                    {isClaimed ? (
                      <View style={styles.claimedBadge}>
                        <Text style={styles.claimedTxt}>✓ CLAIMED</Text>
                      </View>
                    ) : isDone ? (
                      <Pressable
                        style={styles.claimBtn}
                        onPress={() => claimMissionReward(m.id, m.reward)}
                      >
                        <Text style={styles.claimTxt}>CLAIM COINS</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <Text style={styles.lockedTxt}>IN PROGRESS</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {activeTab === 'settings' && (
          <View style={styles.body}>
            <Text style={styles.settingHeader}>VOLUME SETTINGS</Text>

            {/* Music volume option */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🎵 Music Volume</Text>
              <View style={styles.volumePills}>
                {[0, 0.2, 0.5, 0.8].map((v) => (
                  <Pressable
                    key={`music-${v}`}
                    style={[styles.volumePill, musicVolume === v && styles.volumePillActive]}
                    onPress={() => handleMusicVolumeChange(v)}
                  >
                    <Text style={[styles.volumePillTxt, musicVolume === v && styles.volumePillTxtActive]}>
                      {v === 0 ? 'Mute' : `${Math.round(v * 100)}%`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Sound volume option */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🔊 SFX Volume</Text>
              <View style={styles.volumePills}>
                {[0, 0.2, 0.5, 0.8].map((v) => (
                  <Pressable
                    key={`sound-${v}`}
                    style={[styles.volumePill, soundVolume === v && styles.volumePillActive]}
                    onPress={() => handleSoundVolumeChange(v)}
                  >
                    <Text style={[styles.volumePillTxt, soundVolume === v && styles.volumePillTxtActive]}>
                      {v === 0 ? 'Mute' : `${Math.round(v * 100)}%`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.resetContainer}>
              <Text style={styles.resetLabel}>Highway Rush v1.0.0</Text>
              <Text style={styles.resetSub}>Press settings presets to adjust sounds immediately.</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0D0F17ee',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    backgroundColor: '#161926',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292E42',
    shadowColor: '#4FD1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  subhead: {
    color: '#4FD1FF',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '900',
    marginBottom: 4,
    textShadowColor: '#4FD1FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  title: {
    color: '#EAEAF0',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 24,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2233',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#2D334A',
  },
  tabTxt: {
    color: '#8A8FA3',
    fontSize: 12,
    fontWeight: '800',
  },
  tabTxtActive: {
    color: '#EAEAF0',
  },
  body: {
    width: '100%',
    alignItems: 'center',
  },
  scrollBody: {
    width: '100%',
    maxHeight: 340,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#202436',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D334A',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statValue: {
    color: '#EAEAF0',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A8FA3',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  startBtn: {
    backgroundColor: '#4FD1FF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  startTxt: {
    color: '#0B0D12',
    fontSize: 16,
    fontWeight: '900',
  },
  dailyBtn: {
    backgroundColor: '#FF7A59',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  dailyTxt: {
    color: '#EAEAF0',
    fontSize: 15,
    fontWeight: '900',
  },
  dailyBestTxt: {
    color: '#FFEAE5',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
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
  },
  hintTxt: {
    color: '#656A7D',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  // Missions styles
  missionCard: {
    backgroundColor: '#202436',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D334A',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTitle: {
    color: '#EAEAF0',
    fontSize: 15,
    fontWeight: '800',
  },
  missionReward: {
    color: '#FFD54F',
    fontSize: 14,
    fontWeight: '900',
  },
  missionDesc: {
    color: '#8A8FA3',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#161926',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4FD1FF',
  },
  progressTxt: {
    color: '#EAEAF0',
    fontSize: 11,
    fontWeight: '800',
  },
  missionFooter: {
    alignItems: 'flex-end',
  },
  claimBtn: {
    backgroundColor: '#FFD54F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  claimTxt: {
    color: '#0B0D12',
    fontSize: 12,
    fontWeight: '900',
  },
  claimedBadge: {
    backgroundColor: '#00C85322',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00C853',
  },
  claimedTxt: {
    color: '#00C853',
    fontSize: 11,
    fontWeight: '900',
  },
  lockedBadge: {
    backgroundColor: '#333745',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  lockedTxt: {
    color: '#656A7D',
    fontSize: 11,
    fontWeight: '800',
  },
  // Settings styles
  settingHeader: {
    color: '#8A8FA3',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '900',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  settingRow: {
    width: '100%',
    marginBottom: 20,
  },
  settingLabel: {
    color: '#EAEAF0',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  volumePills: {
    flexDirection: 'row',
    gap: 6,
  },
  volumePill: {
    flex: 1,
    backgroundColor: '#202436',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D334A',
  },
  volumePillActive: {
    backgroundColor: '#4FD1FF',
    borderColor: '#4FD1FF',
  },
  volumePillTxt: {
    color: '#8A8FA3',
    fontSize: 11,
    fontWeight: '800',
  },
  volumePillTxtActive: {
    color: '#0B0D12',
  },
  resetContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  resetLabel: {
    color: '#8A8FA3',
    fontSize: 11,
    fontWeight: '700',
  },
  resetSub: {
    color: '#656A7D',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
});
