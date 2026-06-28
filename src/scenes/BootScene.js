// =============================================================
// BootScene.js — First scene, loads minimal assets, registers SW
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load only the splash screen logo graphic
    // Everything else loads in PreloadScene
  }

  create() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;

    // Dark backdrop
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, C.UI_BG);

    // Animated logo
    this._buildLogo();

    // Transition after brief splash
    this.time.delayedCall(1800, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PreloadScene');
      });
    });
  }

  _buildLogo() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;

    // Neon hexagon grid background
    const bg = this.add.graphics();
    bg.lineStyle(1, C.NEON_CYAN, 0.08);
    for (let x = 0; x < WIDTH; x += 40) {
      for (let y = 0; y < HEIGHT; y += 46) {
        this._drawHex(bg, x + (y % 2 === 0 ? 0 : 20), y, 22);
      }
    }

    // Glow circle
    const glow = this.add.graphics();
    glow.fillStyle(C.NEON_CYAN, 0.05);
    glow.fillCircle(WIDTH / 2, HEIGHT / 2 - 40, 130);

    // Logo symbol — stylized 'R' in a hexagon
    const logo = this.add.graphics();
    logo.lineStyle(4, C.NEON_CYAN, 1);
    this._drawHex(logo, WIDTH / 2, HEIGHT / 2 - 40, 70);

    // 'R' shape
    logo.lineStyle(6, C.PLAYER_BODY, 1);
    logo.lineBetween(WIDTH / 2 - 20, HEIGHT / 2 - 90, WIDTH / 2 - 20, HEIGHT / 2 + 10);
    logo.beginPath();
    logo.arc(WIDTH / 2 - 20, HEIGHT / 2 - 60, 20, -Math.PI / 2, Math.PI / 2, false);
    logo.strokePath();
    logo.lineBetween(WIDTH / 2 - 20, HEIGHT / 2 - 40, WIDTH / 2 + 18, HEIGHT / 2 + 10);

    // Title text
    this.add.text(WIDTH / 2, HEIGHT / 2 + 70, 'RODRIGUEZ', {
      fontFamily: '"Orbitron", monospace',
      fontSize: `${Math.min(72, WIDTH * 0.14)}px`,
      fontStyle: 'bold',
      fill: '#ffffff',
      letterSpacing: 6,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 130, 'R U N', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '54px',
      fontStyle: 'bold',
      fill: '#00d4ff',
      letterSpacing: 12,
      shadow: { x: 0, y: 0, color: '#00d4ff', blur: 20, fill: true },
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 175, 'SARA SAFESTAY', {
      font: '14px "Orbitron", monospace', fill: '#00d4ff', letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0.7);

    // Pulse glow animation
    this.tweens.add({
      targets: glow,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 1200,
    });

    // Fade in logo
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  _drawHex(g, cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    g.strokePoints(pts, true);
  }
}
