import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRunStore } from '../state/useRunStore';

interface Props {
  visible: boolean;
  onResume: () => void;
  onQuit: () => void;
}

export function PauseOverlay({ visible, onResume, onQuit }: Props) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>GAME PAUSED</Text>
          
          <Pressable style={[styles.btn, styles.resumeBtn]} onPress={onResume}>
            <Text style={styles.resumeTxt}>RESUME</Text>
          </Pressable>

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
    padding: 32,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4FD1FF',
  },
  title: {
    color: '#EAEAF0',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 28,
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
});
