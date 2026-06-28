// =============================================================
// HUD.js — In-game heads-up display
// Score, coins, distance, combo, powerup timers
// Runs in UIScene which overlays GameScene
// =============================================================

import { CONFIG } from '../config.js';
import { bus } from '../utils/EventBus.js';

export class HUD {
  constructor(scene) {
    this._scene = scene;
    this._score = 0;
    this._displayScore = 0;
    this._coins = 0;
    this._distance = 0;
    this._combo = 0;
    this._multiplier = 1;
    this._powerups = {}; // key -> { duration, remaining, gfx }

    this._build();
    this._subscribeEvents();
  }

  _build() {
    const s = this._scene;
    const { width: W, height: H } = s.sys.game.canvas; // Initial values

    // ── Top bar panel ───────────────────────────────────────
    this._topPanel = s.add.graphics().setDepth(50);
    this._topPanel.fillStyle(0x000000, 0.45);
    this._topPanel.fillRect(0, 0, 4000, 72); // Make it super wide to always cover

    // Score - responsive font size
    const scoreFontSize = Math.min(54, Math.max(28, Math.floor(W * 0.11))) + 'px';
    this._scoreLbl = s.add.text(W / 2, 10, '0', {
      fontFamily: '"Orbitron", monospace', fontSize: scoreFontSize, fontStyle: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { x: 2, y: 2, color: '#00d4ff', blur: 12, fill: true },
    }).setOrigin(0.5, 0).setDepth(51);

    // Score sub-label
    this._scoreSubLbl = s.add.text(W / 2, Math.min(70, Math.floor(W * 0.145)), 'SCORE', {
      fontFamily: '"Orbitron", monospace', fontSize: '14px',
      fill: '#00d4ff',
      letterSpacing: 3,
    }).setOrigin(0.5, 0).setDepth(51);

    // Distance (left)
    this._distLbl = s.add.text(16, 12, '0m', {
      fontFamily: '"Orbitron", monospace', fontSize: '24px', fontStyle: 'bold',
      fill: '#ffbe0b',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(51);
    this._distIcon = s.add.text(16, 40, 'DIST', {
      fontFamily: '"Orbitron", monospace', fontSize: '12px',
      fill: '#ffbe0b88',
    }).setDepth(51);

    // Coins (right)
    this._coinIcon = this._drawCoinIcon(0, 0); // Drawn at origin, moved later
    this._coinLbl = s.add.text(W - 85, 12, '0', {
      fontFamily: '"Orbitron", monospace', fontSize: '32px', fontStyle: 'bold',
      fill: '#ffbe0b',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(51);
    this._coinSubLbl = s.add.text(W - 85, 48, 'EUROS', {
      fontFamily: '"Orbitron", monospace', fontSize: '14px',
      fill: '#ffbe0b88',
    }).setDepth(51);

    // ── Combo display ───────────────────────────────────────
    this._comboBg = s.add.graphics().setDepth(50).setAlpha(0);
    this._comboLbl = s.add.text(W / 2, 90, '', {
      fontFamily: '"Orbitron", monospace', fontSize: '36px', fontStyle: 'bold',
      fill: '#ff006e',
      shadow: { x: 0, y: 0, color: '#ff006e', blur: 16, fill: true },
    }).setOrigin(0.5, 0).setDepth(51).setAlpha(0);

    this._comboBar = s.add.graphics().setDepth(51).setAlpha(0);

    // ── Powerup icon row ────────────────────────────────────
    this._puContainer = s.add.container(12, H - 120).setDepth(51);
    this._puSlots = [];

    // ── Pause button ────────────────────────────────────────
    this._pauseBtn = s.add.text(W - 16, 88, '⏸', {
      fontFamily: 'sans-serif', fontSize: '32px',
      fill: '#ffffff88',
    }).setOrigin(1, 0).setDepth(51).setInteractive({ useHandCursor: true });
    this._pauseBtn.on('pointerdown', () => bus.emit('input:pause'));
    this._pauseBtn.on('pointerover', () => this._pauseBtn.setFill('#ffffff'));
    this._pauseBtn.on('pointerout', () => this._pauseBtn.setFill('#ffffff88'));
  }

  _drawCoinIcon(x, y) {
    const container = this._scene.add.container(x, y).setDepth(51);
    const g = this._scene.add.graphics();
    g.fillStyle(CONFIG.COLORS.COIN, 1);
    g.fillCircle(0, 0, 12);
    g.fillStyle(0xcc8800, 1);
    g.fillCircle(0, 0, 9);
    
    const euroText = this._scene.add.text(0, 0, '€', {
      fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', fill: '#ffffcc'
    }).setOrigin(0.5);

    container.add([g, euroText]);
    return container;
  }

  _subscribeEvents() {
    bus.on('score:update', ({ score, combo, multiplier }) => {
      this._combo = combo;
      this._multiplier = multiplier;
    });
    bus.on('score:comboUp', ({ multiplier }) => {
      this._showComboText(`x${multiplier} COMBO!`);
    });
    bus.on('score:comboBreak', () => {
      this._hideCombo();
    });
    bus.on('powerup:start', ({ key, duration }) => {
      this._addPowerupSlot(key, duration);
    });
    bus.on('powerup:end', ({ key }) => {
      this._removePowerupSlot(key);
    });
  }

  _showComboText(text) {
    this._comboLbl.setText(text).setAlpha(1).setScale(1.4);
    this._comboBg.setAlpha(1);
    this._scene.tweens.add({
      targets: this._comboLbl,
      scaleX: 1, scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  _hideCombo() {
    this._scene.tweens.add({
      targets: [this._comboLbl, this._comboBg, this._comboBar],
      alpha: 0,
      duration: 400,
    });
  }

  _addPowerupSlot(key, duration) {
    const existingIdx = this._puSlots.findIndex(s => s.key === key);
    if (existingIdx >= 0) {
      this._puSlots[existingIdx].remaining = duration;
      return;
    }
    const slot = { key, duration, remaining: duration, gfx: null, timerGfx: null };
    const x = this._puSlots.length * 52;
    slot.gfx = this._scene.add.graphics().setDepth(51);
    slot.timerGfx = this._scene.add.graphics().setDepth(52);
    this._puContainer.add([slot.gfx, slot.timerGfx]);
    this._puSlots.push(slot);
    this._drawPuSlot(slot, x);
  }

  _removePowerupSlot(key) {
    const idx = this._puSlots.findIndex(s => s.key === key);
    if (idx >= 0) {
      const slot = this._puSlots[idx];
      slot.gfx.destroy();
      slot.timerGfx.destroy();
      this._puSlots.splice(idx, 1);
    }
  }

  _drawPuSlot(slot, x) {
    const g = slot.gfx;
    g.clear();
    g.fillStyle(0x16213e, 0.9);
    g.fillRoundedRect(x, 0, 44, 44, 6);
    g.lineStyle(2, CONFIG.COLORS.NEON_CYAN, 0.7);
    g.strokeRoundedRect(x, 0, 44, 44, 6);
  }

  update(scoreManager) {
    const { width: W, height: H } = this._scene.sys.game.canvas;

    // Responsive positioning
    this._scoreLbl.x = W / 2;
    this._scoreSubLbl.x = W / 2;
    this._comboLbl.x = W / 2;
    this._coinIcon.x = W - 110;
    this._coinIcon.y = 28;
    this._coinLbl.x = W - 85;
    this._coinSubLbl.x = W - 85;
    this._pauseBtn.x = W - 16;
    this._puContainer.y = H - 120;

    // Smooth score counter
    this._displayScore += (scoreManager.score - this._displayScore) * 0.1;
    this._scoreLbl.setText(Math.floor(this._displayScore).toLocaleString());

    // Distance
    this._distLbl.setText(`${scoreManager.distance}m`);

    // Coins (Total Euros = previous total + current run)
    const saveManager = this._scene.game.registry.get('saveManager');
    const totalEuros = (saveManager ? saveManager.totalCoins : 0) + (scoreManager.coins * CONFIG.SCORE.COIN_VALUE);
    this._coinLbl.setText(totalEuros.toLocaleString());

    // Combo bar
    if (scoreManager.comboCount > 0) {
      const frac = scoreManager.comboTimerFraction;
      this._comboBar.clear().setAlpha(1);
      this._comboBar.fillStyle(0x16213e, 0.7);
      this._comboBar.fillRoundedRect(W / 2 - 80, 118, 160, 8, 4);
      this._comboBar.fillStyle(CONFIG.COLORS.NEON_MAGENTA, 1);
      this._comboBar.fillRoundedRect(W / 2 - 80, 118, 160 * frac, 8, 4);
      this._comboLbl.setAlpha(1).setText(`x${scoreManager.multiplier} ☆ ${scoreManager.comboCount}`);
    }

    // Powerup timer rings
    this._puSlots.forEach((slot, i) => {
      slot.remaining -= 16; // approx per frame
      const frac = Math.max(0, slot.remaining / slot.duration);
      const x = i * 52;
      const tg = slot.timerGfx;
      tg.clear();
      tg.lineStyle(3, CONFIG.COLORS.NEON_CYAN, 0.9);
      tg.beginPath();
      tg.arc(x + 22, 22, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false);
      tg.strokePath();
      if (frac <= 0) bus.emit('powerup:end', { key: slot.key });
    });
  }

  destroy() {
    bus.off('score:update');
    bus.off('score:comboUp');
    bus.off('score:comboBreak');
    bus.off('powerup:start');
    bus.off('powerup:end');
  }
}
