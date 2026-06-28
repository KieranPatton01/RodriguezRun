// =============================================================
// StatsScene.js — Player statistics overview
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Transitions } from '../ui/Transitions.js';

export class StatsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatsScene' });
  }

  init() {
    this._save = this.game.registry.get('saveManager');
  }

  create() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;
    const save = this._save;

    Transitions.fadeIn(this, 300);
    this.add.rectangle(WIDTH/2, HEIGHT/2, WIDTH, HEIGHT, 0x000000, 0.85).setDepth(70);

    const panelW = 340, panelH = 460;
    const px = WIDTH/2 - panelW/2;
    const py = HEIGHT/2 - panelH/2;

    const panel = this.add.graphics().setDepth(71);
    panel.fillStyle(0x0d1b2a, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 16);
    panel.lineStyle(2, C.NEON_GREEN, 0.7);
    panel.strokeRoundedRect(px, py, panelW, panelH, 16);

    this.add.text(WIDTH/2, py + 24, '📊 STATISTICS', {
      font: 'bold 16px "Orbitron", monospace', fill: '#06d6a0',
    }).setOrigin(0.5).setDepth(72);

    const stats = [
      { label: 'HIGH SCORE',     value: save.highScore.toLocaleString(),            icon: '⭐' },
      { label: 'TOTAL COINS',    value: save.totalCoins.toLocaleString(),           icon: '🪙' },
      { label: 'TOTAL RUNS',     value: save.get('totalRuns').toLocaleString(),     icon: '🏃' },
      { label: 'BEST DISTANCE',  value: `${save.get('bestDistance')}m`,             icon: '📍' },
      { label: 'LONGEST COMBO',  value: `x${save.get('longestCombo')}`,             icon: '⚡' },
      { label: 'TOTAL DISTANCE', value: `${Math.floor(save.get('totalDistance'))}m`, icon: '🌎' },
    ];

    stats.forEach(({ label, value, icon }, i) => {
      const y = py + 72 + i * 58;
      // Row bg
      const rowG = this.add.graphics().setDepth(71);
      rowG.fillStyle(i % 2 === 0 ? 0x16213e : 0x0d1b2a, 0.5);
      rowG.fillRoundedRect(px + 10, y, panelW - 20, 50, 6);

      this.add.text(px + 28, y + 10, icon, { font: '22px sans-serif' }).setDepth(72);
      this.add.text(px + 64, y + 6, label, {
        fontFamily: '"Orbitron", monospace', fontSize: '12px', fill: '#ffffff', letterSpacing: 2,
      }).setDepth(72);
      const valTxt = this.add.text(px + panelW - 24, y + 18, value, {
        fontFamily: '"Orbitron", monospace', fontSize: '24px', fontStyle: 'bold', fill: '#ffffff',
      }).setOrigin(1, 0.5).setDepth(72).setAlpha(0);
      this.tweens.add({
        targets: valTxt, alpha: 1,
        duration: 300, delay: i * 80, ease: 'Power2',
      });
    });

    const closeBtn = this.add.text(WIDTH/2, py + panelH - 24, '✕ CLOSE', {
      font: '12px "Orbitron", monospace', fill: '#ffffff88',
    }).setOrigin(0.5).setDepth(72).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => {
      this.scene.resume('MenuScene');
      this.scene.stop();
    });
  }
}
