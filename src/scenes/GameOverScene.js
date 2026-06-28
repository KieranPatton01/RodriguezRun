// =============================================================
// GameOverScene.js — Game over screen with stats, high score
// confetti for new records, retry and menu buttons
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { GameButton } from '../ui/Buttons.js';
import { Transitions } from '../ui/Transitions.js';
import { bus } from '../utils/EventBus.js';
import { getAudioContext } from '../utils/AudioSynth.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this._data = data || {};
  }

  create() {
    bus.clear();
    bus.on('sfx:play', ({ key }) => this._playSound(key));

    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;
    const d = this._data;

    Transitions.fadeIn(this, 500);

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x020510, 0x020510, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // Scanlines overlay
    const scan = this.add.graphics();
    for (let y = 0; y < HEIGHT; y += 4) {
      scan.fillStyle(0x000000, 0.08);
      scan.fillRect(0, y, WIDTH, 2);
    }

    // Side accent lines
    this.add.graphics().lineStyle(1, C.NEON_CYAN, 0.25)
      .lineBetween(30, 0, 30, HEIGHT)
      .lineBetween(WIDTH - 30, 0, WIDTH - 30, HEIGHT);

    // ── Header ─────────────────────────────────────────────
    const headerY = HEIGHT * 0.1;
    if (d.isNewHighScore) {
      const newRecord = this.add.text(WIDTH / 2, headerY, 'NEW RECORD!', {
        fontFamily: '"Orbitron", monospace', fontSize: '42px', fontStyle: 'bold',
        fill: '#ffbe0b',
        shadow: { x: 0, y: 0, color: '#ffbe0b', blur: 30, fill: true },
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: newRecord, alpha: 1, scaleX: 1.1, scaleY: 1.1,
        yoyo: true, repeat: 2, duration: 400,
      });
      this._triggerConfetti();
      this._playSound('sfx_newrecord');
    } else {
      this.add.text(WIDTH / 2, headerY, 'GAME OVER', {
        fontFamily: '"Orbitron", monospace', fontSize: '54px', fontStyle: 'bold',
        fill: '#ff006e',
        stroke: '#ffffff',
        strokeThickness: 3,
        shadow: { x: 2, y: 2, color: '#000000', blur: 10, fill: true },
      }).setOrigin(0.5);
    }

    // Subtitle
    this.add.text(WIDTH / 2, headerY + 54, 'SILLY STRANGER SARA', {
      fontFamily: '"Orbitron", monospace', fontSize: '18px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      letterSpacing: 3,
    }).setOrigin(0.5);

    // ── Score panel ──────────────────────────────────────────
    const panelY = HEIGHT * 0.22;
    const panelH = 260;
    const panelPanel = this.add.graphics();
    panelPanel.fillStyle(0x16213e, 0.9);
    panelPanel.fillRoundedRect(WIDTH/2 - 200, panelY, 400, panelH, 14);
    panelPanel.lineStyle(2, C.NEON_CYAN, 0.5);
    panelPanel.strokeRoundedRect(WIDTH/2 - 200, panelY, 400, panelH, 14);

    const rows = [
      { label: 'SCORE',    value: (d.score || 0).toLocaleString(), color: '#ffffff' },
      { label: 'DISTANCE', value: `${d.distance || 0}m`,           color: '#00d4ff' },
      { label: 'EUROS',    value: d.coins || 0,                    color: '#ffbe0b' },
      { label: 'COMBO',    value: `x${d.combo || 0} peak`,         color: '#ff006e' },
    ];
    rows.forEach((row, i) => {
      const y = panelY + 30 + i * 55;
      this.add.text(WIDTH / 2 - 160, y, row.label, {
        fontFamily: '"Orbitron", monospace', fontSize: '16px', fill: '#ffffff55', letterSpacing: 2,
      }).setOrigin(0, 0.5);
      const valTxt = this.add.text(WIDTH / 2 + 160, y, row.value, {
        fontFamily: '"Orbitron", monospace', fontSize: '28px', fontStyle: 'bold', fill: row.color,
      }).setOrigin(1, 0.5).setAlpha(0);
      this.tweens.add({
        targets: valTxt, alpha: 1, x: WIDTH / 2 + 160,
        duration: 400, delay: 200 + i * 120, ease: 'Power2',
      });
    });

    // Best score
    const bestY = panelY + panelH + 18;
    this.add.text(WIDTH / 2, bestY, `BEST: ${(d.highScore || 0).toLocaleString()}`, {
      fontFamily: '"Orbitron", monospace', fontSize: '13px',
      fill: '#ffbe0b88',
      shadow: { x: 0, y: 0, color: '#ffbe0b', blur: 6, fill: true },
    }).setOrigin(0.5);

    // ── Buttons ──────────────────────────────────────────────
    const btnY = bestY + 80;
    this._retryBtn = new GameButton(this, WIDTH / 2, btnY, 'TRY AGAIN', {
      width: 240, height: 60, color: C.NEON_GREEN, textColor: '#000000',
      fontSize: '20px', onClick: () => Transitions.fadeOut(this, 'GameScene'),
    });
    this._menuBtn = new GameButton(this, WIDTH / 2, btnY + 75, 'MAIN MENU', {
      width: 240, height: 60, color: C.NEON_CYAN, textColor: '#000000',
      fontSize: '20px', onClick: () => Transitions.fadeOut(this, 'MenuScene'),
    });
    this._tutBtn = new GameButton(this, WIDTH / 2, btnY + 150, 'REPLAY TUTORIAL', {
      width: 240, height: 60, color: C.NEON_AMBER, textColor: '#000000',
      fontSize: '20px', onClick: () => Transitions.fadeOut(this, 'TutorialScene'),
    });

    // Entrance animations for buttons
    [this._retryBtn._container, this._menuBtn._container, this._tutBtn._container].forEach((c, i) => {
      c.setAlpha(0).setY(c.y + 20);
      this.tweens.add({
        targets: c, alpha: 1, y: c.y - 20,
        duration: 400, delay: 800 + i * 150, ease: 'Back.easeOut',
      });
    });

    // ── Share hint ───────────────────────────────────────────
    this.add.text(WIDTH / 2, HEIGHT * 0.91,
      'PRESS ANY BUTTON TO GO AGAIN', {
      fontFamily: '"Orbitron", monospace', fontSize: '18px', fontStyle: 'bold',
      fill: '#ffffff', 
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Allow pressing any key to retry
    this.input.keyboard.on('keydown', () => {
      // Prevent multiple triggers if already fading out
      if (!this._retrying) {
        this._retrying = true;
        Transitions.fadeOut(this, 'GameScene', {}, 400);
      }
    });
  }

  _triggerConfetti() {
    const colors = [0xff006e, 0xffbe0b, 0x00d4ff, 0x06d6a0, 0x8338ec, 0xff6b35];
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    for (let i = 0; i < 60; i++) {
      this.time.delayedCall(Math.random() * 1200, () => {
        const x = Math.random() * WIDTH;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const p = this.add.graphics().setDepth(100);
        p.fillStyle(color, 1);
        p.fillRect(0, 0, 8, 8);
        p.x = x; p.y = -10;
        this.tweens.add({
          targets: p,
          x: x + (Math.random() - 0.5) * 200,
          y: HEIGHT + 20,
          angle: Math.random() * 720 - 360,
          duration: 2000 + Math.random() * 1000,
          ease: 'Linear',
          onComplete: () => p.destroy(),
        });
      });
    }
  }

  _playSound(key) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const save = this.game.registry.get('saveManager');
      const muted = save?.getSetting('muted') || false;
      if (muted) return;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      if (key === 'sfx_newrecord') {
        // Triumphant arpeggio
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = ctx.createOscillator();
          o.connect(gain);
          o.frequency.value = f;
          o.type = 'sine';
          gain.gain.value = 0.08;
          o.start(ctx.currentTime + i * 0.1);
          o.stop(ctx.currentTime + i * 0.1 + 0.15);
        });
      }
    } catch(e) {}
  }

  shutdown() {
    bus.off('sfx:play');
  }
}
