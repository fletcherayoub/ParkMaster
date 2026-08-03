/**
 * Sound Engine — Uses expo-audio (createAudioPlayer) for native playback
 * on Android/iOS. All sounds are preloaded from the assets/audio folder.
 */
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

class SoundEngine {
  private isMuted = false;
  private isBgmPlaying = false;

  // Lazy-loaded players
  private bgmPlayer: AudioPlayer | null = null;
  private crashPlayer: AudioPlayer | null = null;
  private bustedPlayer: AudioPlayer | null = null;
  private coinPlayer: AudioPlayer | null = null;

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isBgmPlaying) {
      this.stopBGM();
    } else if (!this.isMuted && !this.isBgmPlaying) {
      this.startBGM();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // ─── BGM ──────────────────────────────────────────────────────────────────

  public startBGM() {
    if (this.isMuted) return;
    this.isBgmPlaying = true;

    try {
      if (!this.bgmPlayer) {
        this.bgmPlayer = createAudioPlayer(require('../../assets/audio/mp.mp3'));
        this.bgmPlayer.loop = true;
        this.bgmPlayer.volume = 0.6;
      }
      this.bgmPlayer.seekTo(0);
      this.bgmPlayer.play();
    } catch (e) {
      console.warn('BGM play error:', e);
    }
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    try {
      if (this.bgmPlayer) {
        this.bgmPlayer.pause();
        this.bgmPlayer.seekTo(0);
      }
    } catch {}
  }

  // ─── Sound Effects ────────────────────────────────────────────────────────

  /** Simple coin pickup bleep — reuses a single player */
  public playCoinSound() {
    if (this.isMuted) return;
    try {
      // Coin sound is light, we just reuse one player
      if (!this.coinPlayer) {
        // We don't have a dedicated coin.mp3, so we'll skip for now
        // (the visual popup is the feedback)
        return;
      }
      this.coinPlayer.seekTo(0);
      this.coinPlayer.play();
    } catch {}
  }

  /** Play car crash SFX from assets */
  public playCrashSound() {
    this.playCarCrashSFX();
  }

  /** Play the real car crash sound effect */
  public playCarCrashSFX() {
    if (this.isMuted) return;
    try {
      if (!this.crashPlayer) {
        this.crashPlayer = createAudioPlayer(require('../../assets/audio/Car Crash sound.mp3'));
        this.crashPlayer.volume = 0.9;
      }
      this.crashPlayer.seekTo(0);
      this.crashPlayer.play();
    } catch (e) {
      console.warn('Crash SFX error:', e);
    }
  }

  /** Play the police BUSTED sound effect */
  public playBustedSFX() {
    if (this.isMuted) return;
    try {
      if (!this.bustedPlayer) {
        this.bustedPlayer = createAudioPlayer(require('../../assets/audio/POLICE FREEZE! SOUND EFFECT.mp3'));
        this.bustedPlayer.volume = 1.0;
      }
      this.bustedPlayer.seekTo(0);
      this.bustedPlayer.play();
    } catch (e) {
      console.warn('Busted SFX error:', e);
    }
  }

  // ─── Unused stubs (kept for interface compatibility) ──────────────────────

  public playSlipSound() {}
  public playQuackSound() {}
}

export const soundEngine = new SoundEngine();
