import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../state/usePlayerStore';
import { soundEngine } from '../utils/audio';

interface Props {
  visible: boolean;
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ visible, onResume, onQuit }: Props) {
  const soundVolume = usePlayerStore((s) => s.soundVolume);
  const musicVolume = usePlayerStore((s) => s.musicVolume);
  const setSoundVolume = usePlayerStore((s) => s.setSoundVolume);
  const setMusicVolume = usePlayerStore((s) => s.setMusicVolume);

  if (!visible) return null;

  const handleSoundVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    soundEngine.updateVolumeSettings(undefined, vol);
  };

  const handleMusicVolumeChange = (vol: number) => {
    setMusicVolume(vol);
    soundEngine.updateVolumeSettings(vol, undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>GAME PAUSED</Text>
          
          <Pressable style={[styles.btn, styles.resumeBtn]} onPress={onResume}>
            <Text style={styles.resumeTxt}>RESUME</Text>
          </Pressable>

          {/* Volume settings */}
          <View style={styles.settingsSection}>
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

            <Text style={[styles.settingLabel, { marginTop: 14 }]}>🔊 SFX Volume</Text>
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

          <Pressable style={[styles.btn, styles.quitBtn]} onPress={onQuit}>
            <Text style={styles.quitTxt}>QUIT RUN</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 15, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1E2235',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4FD1FF',
  },
  title: {
    color: '#EAEAF0',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  resumeBtn: {
    backgroundColor: '#4FD1FF',
  },
  quitBtn: {
    backgroundColor: '#333745',
    marginBottom: 0,
  },
  resumeTxt: {
    color: '#0D0F17',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  quitTxt: {
    color: '#FF7A59',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Settings Volume controls inside modal
  settingsSection: {
    width: '100%',
    backgroundColor: '#161926',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D334A',
  },
  settingLabel: {
    color: '#EAEAF0',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  volumePills: {
    flexDirection: 'row',
    gap: 4,
  },
  volumePill: {
    flex: 1,
    backgroundColor: '#202436',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D334A',
  },
  volumePillActive: {
    backgroundColor: '#4FD1FF',
    borderColor: '#4FD1FF',
  },
  volumePillTxt: {
    color: '#8A8FA3',
    fontSize: 10,
    fontWeight: '800',
  },
  volumePillTxtActive: {
    color: '#0B0D12',
  },
});
