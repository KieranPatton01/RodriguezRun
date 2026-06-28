// =============================================================
// PreloadScene.js — Asset loading with animated progress bar
// All programmatic textures are generated here via canvas/graphics
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this._buildLoadingUI();
    this._generateTextures();
    this._loadAudio();

    this.load.on('progress', v => this._updateProgress(v));
  }

  create() {
    // Tiny pause for last tween to settle, then boot menu
    this.time.delayedCall(300, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  // ── Loading UI ──────────────────────────────────────────────
  _buildLoadingUI() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, C.UI_BG);

    // Scanning line animation
    const scanLine = this.add.rectangle(WIDTH / 2, 0, WIDTH, 2, C.NEON_CYAN, 0.5);
    this.tweens.add({
      targets: scanLine,
      y: HEIGHT,
      duration: 1600,
      repeat: -1,
      ease: 'Linear',
    });

    // Logo watermark
    this.add.text(WIDTH / 2, HEIGHT * 0.3, 'RODRIGUEZ RUN', {
      font: 'bold 24px "Orbitron", monospace',
      fill: '#ffffff22',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Loading label
    this._loadingText = this.add.text(WIDTH / 2, HEIGHT * 0.58, 'INITIALIZING...', {
      font: '11px "Orbitron", monospace',
      fill: '#00d4ff',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Progress bar track
    const trackW = 280, trackH = 6;
    const trackX = WIDTH / 2 - trackW / 2;
    const trackY = HEIGHT * 0.63;

    this.add.rectangle(WIDTH / 2, trackY + trackH / 2, trackW, trackH, 0x16213e)
      .setOrigin(0.5);

    // Progress fill
    this._progressFill = this.add.rectangle(trackX, trackY, 0, trackH, C.NEON_CYAN)
      .setOrigin(0, 0);

    // Progress glow
    this._progressGlow = this.add.rectangle(trackX, trackY, 0, trackH, C.NEON_CYAN, 0.3)
      .setOrigin(0, 0);

    // Percent text
    this._pctText = this.add.text(WIDTH / 2, trackY + 16, '0%', {
      font: '9px "Orbitron", monospace',
      fill: '#ffffff44',
    }).setOrigin(0.5, 0);

    this._trackW = trackW;
    this._trackX = trackX;

    // Corner decoration
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const cx = WIDTH / 2 + sx * (trackW / 2 + 20);
      const cy = HEIGHT * 0.63 + sy * 30;
      const deco = this.add.graphics();
      deco.lineStyle(1, C.NEON_CYAN, 0.4);
      deco.lineBetween(cx, cy, cx + sx * 12, cy);
      deco.lineBetween(cx, cy, cx, cy + sy * 12);
    });
  }

  _updateProgress(value) {
    const w = this._trackW * value;
    this._progressFill.width = w;
    this._progressGlow.width = w + 10;
    this._pctText.setText(`${Math.floor(value * 100)}%`);
    const messages = [
      'LOADING SARA SAFESTAY...',
      'LOADING WORLD DATA...',
      'CALIBRATING COURIER...',
      'CHARGING POWERUPS...',
      'READY TO RUN...',
    ];
    const idx = Math.floor(value * messages.length);
    this._loadingText.setText(messages[Math.min(idx, messages.length - 1)]);
  }

  // ── Programmatic texture generation ─────────────────────────
  _generateTextures() {
    this._genParticleTextures();
    this._genGroundTexture();
    this._genFontTexture();
  }

  _genParticleTextures() {
    // Star particle
    const starGfx = this.make.graphics({ x: 0, y: 0, add: false });
    starGfx.fillStyle(0xffffff, 1);
    starGfx.beginPath();
    for (let j = 0; j < 10; j++) {
      const rad = j % 2 === 0 ? 8 : 4;
      const a = (j * Math.PI) / 5 - Math.PI / 2;
      if (j === 0) starGfx.moveTo(8 + Math.cos(a) * rad, 8 + Math.sin(a) * rad);
      else starGfx.lineTo(8 + Math.cos(a) * rad, 8 + Math.sin(a) * rad);
    }
    starGfx.closePath();
    starGfx.fillPath();
    starGfx.generateTexture('particle_star', 16, 16);
    starGfx.destroy();

    // Square particle
    const sqGfx = this.make.graphics({ x: 0, y: 0, add: false });
    sqGfx.fillStyle(0xffffff, 1);
    sqGfx.fillRect(0, 0, 8, 8);
    sqGfx.generateTexture('particle_square', 8, 8);
    sqGfx.destroy();

    // Circle glow particle
    const circleGfx = this.make.graphics({ x: 0, y: 0, add: false });
    circleGfx.fillStyle(0xffffff, 1);
    circleGfx.fillCircle(8, 8, 8);
    circleGfx.generateTexture('particle_circle', 16, 16);
    circleGfx.destroy();
  }

  _genGroundTexture() {
    // Cobblestone tile
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x0d0d1f, 1);
    g.fillRect(0, 0, 80, 32);
    g.fillStyle(0x111128, 1);
    g.fillRoundedRect(2, 2, 36, 14, 2);
    g.fillRoundedRect(42, 2, 36, 14, 2);
    g.fillRoundedRect(22, 18, 36, 12, 2);
    g.lineStyle(0.5, 0x00d4ff, 0.06);
    g.strokeRoundedRect(2, 2, 36, 14, 2);
    g.strokeRoundedRect(42, 2, 36, 14, 2);
    g.strokeRoundedRect(22, 18, 36, 12, 2);
    g.generateTexture('ground_tile', 80, 32);
    g.destroy();
  }

  _genFontTexture() {
    // No external bitmap font needed — using web fonts via CSS
    // Ensure Google Font is loaded
    const style = document.createElement('style');
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');`;
    document.head.appendChild(style);
  }

  // ── Audio loading ───────────────────────────────────────────
  _loadAudio() {
    // All audio is generated programmatically using Web Audio API
    // as data URIs. Phaser will load them as audio objects.
    // In production, replace these with actual audio files.

    // For now, we generate silent placeholders and use Web Audio for SFX.
    // The AudioManager will handle fallback gracefully.
    this._generateAudioContext();
  }

  _generateAudioContext() {
    // Pre-warm the AudioContext (must be triggered by user gesture later)
    // Defer actual sound generation until first interaction
    this.game.registry.set('audioReady', false);
  }
}
