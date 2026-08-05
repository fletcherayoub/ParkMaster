import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '../state/usePlayerStore';

class SoundEngine {
  private isMuted = false;
  private isBgmPlaying = false;

  // Lazy-loaded players
  private bgmPlayer: AudioPlayer | null = null;
  private crashPlayer: AudioPlayer | null = null;
  private bustedPlayer: AudioPlayer | null = null;
  private coinPlayer: AudioPlayer | null = null;
  private enginePlayer: AudioPlayer | null = null;
  private outOfFuelPlayer: AudioPlayer | null = null;
  private isEnginePlaying = false;

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.isBgmPlaying) this.stopBGM();
      this.stopEngine();
    } else {
      if (this.isBgmPlaying) this.startBGM();
      if (this.isEnginePlaying) this.startEngine();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public updateVolumeSettings(musicVol?: number, soundVol?: number) {
    const { musicVolume, soundVolume } = usePlayerStore.getState();
    const finalMusicVol = musicVol !== undefined ? musicVol : musicVolume;
    const finalSoundVol = soundVol !== undefined ? soundVol : soundVolume;

    if (this.bgmPlayer) {
      this.bgmPlayer.volume = this.isMuted ? 0 : finalMusicVol;
    }
    if (this.crashPlayer) {
      this.crashPlayer.volume = this.isMuted ? 0 : finalSoundVol;
    }
    if (this.bustedPlayer) {
      this.bustedPlayer.volume = this.isMuted ? 0 : finalSoundVol;
    }
    if (this.enginePlayer) {
      this.enginePlayer.volume = this.isMuted ? 0 : finalSoundVol * 0.35;
    }
    if (this.outOfFuelPlayer) {
      this.outOfFuelPlayer.volume = this.isMuted ? 0 : finalSoundVol;
    }
  }

  // ─── Engine SFX ──────────────────────────────────────────────────────────

  public setEnginePitch(rate: number) {
    try {
      if (this.enginePlayer) {
        this.enginePlayer.playbackRate = rate;
      }
    } catch {}
  }

  public startEngine() {
    if (this.isMuted) return;
    this.isEnginePlaying = true;

    try {
      const { soundVolume } = usePlayerStore.getState();
      if (!this.enginePlayer) {
        try {
          this.enginePlayer = createAudioPlayer(require('../../assets/audio/accelerating.mp3'));
        } catch {
          this.enginePlayer = createAudioPlayer(require('../../assets/audio/mp.mp3'));
        }
        this.enginePlayer.loop = true;
      }
      this.enginePlayer.volume = soundVolume * 0.35;
      this.enginePlayer.play();
    } catch (e) {
      console.warn('Engine SFX play error:', e);
    }
  }

  public stopEngine() {
    try {
      if (this.enginePlayer) {
        this.enginePlayer.pause();
      }
    } catch {}
  }

  // ─── BGM ──────────────────────────────────────────────────────────────────

  public startBGM() {
    if (this.isMuted) return;
    this.isBgmPlaying = true;

    try {
      const { musicVolume } = usePlayerStore.getState();
      if (!this.bgmPlayer) {
        this.bgmPlayer = createAudioPlayer(require('../../assets/audio/mp.mp3'));
        this.bgmPlayer.loop = true;
      }
      this.bgmPlayer.volume = musicVolume;
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
      if (!this.coinPlayer) {
        return;
      }
      const { soundVolume } = usePlayerStore.getState();
      this.coinPlayer.volume = soundVolume;
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
      const { soundVolume } = usePlayerStore.getState();
      if (!this.crashPlayer) {
        this.crashPlayer = createAudioPlayer(require('../../assets/audio/Car Crash sound.mp3'));
      }
      this.crashPlayer.volume = soundVolume;
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
      const { soundVolume } = usePlayerStore.getState();
      if (!this.bustedPlayer) {
        this.bustedPlayer = createAudioPlayer(require('../../assets/audio/POLICE FREEZE! SOUND EFFECT.mp3'));
      }
      this.bustedPlayer.volume = soundVolume;
      this.bustedPlayer.seekTo(0);
      this.bustedPlayer.play();
    } catch (e) {
      console.warn('Busted SFX error:', e);
    }
  }

  /** Play the out of fuel sound effect */
  public playOutOfFuelSFX() {
    if (this.isMuted) return;
    try {
      const { soundVolume } = usePlayerStore.getState();
      if (!this.outOfFuelPlayer) {
        this.outOfFuelPlayer = createAudioPlayer(require('../../assets/audio/outofFuelSound.mp3'));
      }
      this.outOfFuelPlayer.volume = soundVolume;
      this.outOfFuelPlayer.seekTo(0);
      this.outOfFuelPlayer.play();
    } catch (e) {
      console.warn('Out of fuel SFX error:', e);
    }
  }

  // ─── Unused stubs (kept for interface compatibility) ──────────────────────

  public playSlipSound() {}
  public playQuackSound() {}
}

export const soundEngine = new SoundEngine();
