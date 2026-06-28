// =============================================================
// AudioManager.js — Wraps Phaser sound with volume/mute control
// =============================================================

import { CONFIG } from '../config.js';
import { bus } from '../utils/EventBus.js';

export class AudioManager {
  constructor(scene, saveManager) {
    this._scene = scene;
    this._save = saveManager;
    this._music = null;
    this._sfx = {};
    this._muted = saveManager.getSetting('muted');
    this._musicVol = saveManager.getSetting('musicVolume');
    this._sfxVol = saveManager.getSetting('sfxVolume');

    bus.on('settings:mute', ({ muted }) => {
      this._muted = muted;
      this._applyVolumes();
    });
    bus.on('settings:musicVolume', ({ v }) => {
      this._musicVol = v;
      if (this._music && !this._muted) this._music.setVolume(v);
    });
    bus.on('settings:sfxVolume', ({ v }) => {
      this._sfxVol = v;
    });
  }

  _applyVolumes() {
    if (this._music) {
      this._music.setVolume(this._muted ? 0 : this._musicVol);
    }
  }

  /** Play or switch background music track */
  playMusic(key, fadeIn = true) {
    if (this._music && this._music.key === key && this._music.isPlaying) return;
    if (this._music) {
      this._scene.tweens.add({
        targets: this._music,
        volume: 0,
        duration: CONFIG.AUDIO.FADE_DURATION,
        onComplete: () => { this._music.stop(); this._music.destroy(); this._startMusic(key, fadeIn); }
      });
    } else {
      this._startMusic(key, fadeIn);
    }
  }

  _startMusic(key, fadeIn) {
    if (!this._scene.sound.get(key)) return;
    this._music = this._scene.sound.add(key, {
      loop: true,
      volume: (this._muted || !fadeIn) ? (this._muted ? 0 : this._musicVol) : 0,
    });
    this._music.key = key;
    this._music.play();
    if (fadeIn && !this._muted) {
      this._scene.tweens.add({
        targets: this._music,
        volume: this._musicVol,
        duration: CONFIG.AUDIO.FADE_DURATION,
      });
    }
  }

  stopMusic() {
    if (!this._music) return;
    this._scene.tweens.add({
      targets: this._music,
      volume: 0,
      duration: CONFIG.AUDIO.FADE_DURATION,
      onComplete: () => { if (this._music) { this._music.stop(); } }
    });
  }

  /** Play a sound effect */
  playSfx(key, overrides = {}) {
    if (!this._scene.sound.get(key) && !this._scene.cache.audio.has(key)) return;
    const vol = this._muted ? 0 : (overrides.volume ?? this._sfxVol);
    const sound = this._scene.sound.add(key, { volume: vol, ...overrides });
    sound.play();
    sound.once('complete', () => sound.destroy());
  }

  setMuted(v) {
    this._muted = v;
    this._save.setSetting('muted', v);
    this._applyVolumes();
  }
  setMusicVolume(v) {
    this._musicVol = v;
    this._save.setSetting('musicVolume', v);
    this._applyVolumes();
  }
  setSfxVolume(v) {
    this._sfxVol = v;
    this._save.setSetting('sfxVolume', v);
  }
  get muted() { return this._muted; }
  get musicVolume() { return this._musicVol; }
  get sfxVolume() { return this._sfxVol; }

  destroy() {
    if (this._music) { this._music.stop(); this._music.destroy(); }
  }
}
