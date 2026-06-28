// =============================================================
// CheatsScene.js — Cheat codes entry and toggle management
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { GameButton, IconButton } from '../ui/Buttons.js';

const CHEATS_INFO = [
  { id: 'sara', name: 'INFINITE MONEY' },
  { id: 'senthil', name: 'BLACK & WHITE' },
  { id: 'stranger', name: 'GOD MODE' }
];

export class CheatsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CheatsScene' });
  }

  init() {
    this._save = this.game.registry.get('saveManager');
  }

  create() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;

    // Darken background
    const bg = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.85);
    bg.setInteractive(); // Block clicks

    // Panel
    const panelW = 340;
    const panelH = 400;
    const px = WIDTH / 2 - panelW / 2;
    const py = HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x0d1b2a, 1);
    panel.fillRoundedRect(px, py, panelW, panelH, 16);
    panel.lineStyle(2, C.NEON_MAGENTA, 0.8);
    panel.strokeRoundedRect(px, py, panelW, panelH, 16);

    this.add.text(WIDTH / 2, py + 30, 'CHEAT CODES', {
      fontFamily: '"Orbitron", monospace', fontSize: '22px', fontStyle: 'bold', fill: '#ff00ff',
    }).setOrigin(0.5);

    const divG = this.add.graphics();
    divG.lineStyle(1, C.NEON_MAGENTA, 0.3);
    divG.lineBetween(px + 20, py + 60, px + panelW - 20, py + 60);

    // Enter Code Button
    this._enterBtn = new GameButton(this, WIDTH / 2, py + 100, 'ENTER CODE', {
      width: 200, height: 45, color: C.NEON_CYAN, textColor: '#000000', fontSize: '16px',
      onClick: () => this._promptCode(),
    });

    // Render Cheat Toggles
    this._toggleContainer = this.add.container(px + 20, py + 160);
    this._renderToggles();

    // Close Button
    this._closeBtn = new IconButton(this, WIDTH / 2, py + panelH - 40, '✕', () => {
      this.scene.stop();
      this.scene.resume('MenuScene');
    }, C.NEON_MAGENTA);

    // Entrance Animation
    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main, alpha: 1,
      duration: 300, ease: 'Power2'
    });
  }

  _promptCode() {
    const code = window.prompt("Enter Cheat Code:")?.trim().toLowerCase();
    if (!code) return;

    // Special: 'abid' unlocks the Abid skin
    if (code === 'abid') {
      this._save.unlockSkin('abid');
      window.alert("🤑 ABID unlocked! Check your skins!");
      return;
    }

    if (CHEATS_INFO.some(c => c.id === code)) {
      this._save.unlockCheat(code);
      this._save.setCheat(code, true);
      this._renderToggles();
    } else {
      window.alert("Invalid Cheat Code!");
    }
  }

  _renderToggles() {
    this._toggleContainer.removeAll(true);
    let startY = 0;

    CHEATS_INFO.forEach((cheat, index) => {
      // Only show if it's been activated at least once
      const isUnlocked = this._save.isCheatUnlocked(cheat.id);
      if (!isUnlocked) return;

      const isActive = this._save.getCheat(cheat.id);

      this._toggleContainer.add(this.add.text(0, startY, cheat.name, {
        fontFamily: '"Orbitron", monospace', fontSize: '16px', fill: '#ffffff'
      }).setOrigin(0, 0.5));

      const toggleW = 50;
      const toggleH = 24;
      const toggleX = 250;

      const g = this.add.graphics();
      // Track
      g.fillStyle(isActive ? CONFIG.COLORS.NEON_GREEN : 0x333333, 1);
      g.fillRoundedRect(toggleX, startY - toggleH/2, toggleW, toggleH, 12);
      // Knob
      g.fillStyle(0xffffff, 1);
      g.fillCircle(isActive ? toggleX + toggleW - 12 : toggleX + 12, startY, 10);

      this._toggleContainer.add(g);

      const zone = this.add.zone(toggleX + toggleW/2, startY, toggleW, toggleH)
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        const newState = !isActive;
        this._save.setCheat(cheat.id, newState);
        // Apply B&W immediately if senthil
        if (cheat.id === 'senthil') {
          this.sys.game.canvas.style.filter = newState ? 'grayscale(100%)' : '';
        }
        this._renderToggles();
      });

      this._toggleContainer.add(zone);

      startY += 50;
    });
  }
}
