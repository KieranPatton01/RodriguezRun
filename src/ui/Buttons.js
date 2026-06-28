// =============================================================
// Buttons.js — Animated button factory
// Creates styled, interactive buttons with hover/press effects
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { bus } from '../utils/EventBus.js';

export class GameButton {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} label
   * @param {Object} opts - { width, height, color, textColor, fontSize, depth, onClick }
   */
  constructor(scene, x, y, label, opts = {}) {
    this._scene = scene;
    this._opts = {
      width: 220,
      height: 56,
      color: CONFIG.COLORS.NEON_CYAN,
      textColor: '#0d1b2a',
      fontSize: '15px',
      depth: 60,
      onClick: null,
      ...opts,
    };

    this._container = scene.add.container(x, y).setDepth(this._opts.depth);
    this._bg = scene.add.graphics();
    this._label = scene.add.text(0, 0, label, {
      font: `bold ${this._opts.fontSize} "Orbitron", monospace`,
      fill: this._opts.textColor,
    }).setOrigin(0.5);

    this._container.add([this._bg, this._label]);
    this._draw(false, false);
    this._setupInteraction();
  }

  _draw(hover, pressed) {
    const g = this._bg;
    const { width: w, height: h, color } = this._opts;
    g.clear();

    const alpha = pressed ? 0.6 : hover ? 1.0 : 0.85;
    const scale = pressed ? 0.95 : hover ? 1.04 : 1.0;
    this._container.setScale(scale);

    // Shadow
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-w/2 + 3, -h/2 + 3, w, h, 12);

    // Glow
    if (hover || pressed) {
      g.fillStyle(color, 0.15);
      g.fillRoundedRect(-w/2 - 6, -h/2 - 6, w + 12, h + 12, 14);
    }

    // Main body
    g.fillStyle(color, alpha);
    g.fillRoundedRect(-w/2, -h/2, w, h, 12);

    // Top shine
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(-w/2 + 4, -h/2 + 3, w - 8, h/3, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Border
    g.lineStyle(1.5, 0xffffff, 0.3);
    g.strokeRoundedRect(-w/2, -h/2, w, h, 12);
  }

  _setupInteraction() {
    const zone = this._scene.add.zone(0, 0, this._opts.width, this._opts.height)
      .setInteractive({ useHandCursor: true });
    this._container.add(zone);

    zone.on('pointerover',  () => { this._draw(true, false); bus.emit('sfx:play', { key: 'sfx_hover' }); });
    zone.on('pointerout',   () => this._draw(false, false));
    zone.on('pointerdown',  () => this._draw(true, true));
    zone.on('pointerup',    () => {
      this._draw(true, false);
      bus.emit('sfx:play', { key: 'sfx_click' });
      if (this._opts.onClick) this._opts.onClick();
    });
  }

  setLabel(text) {
    this._label.setText(text);
  }

  setVisible(v) {
    this._container.setVisible(v);
    return this;
  }

  setPosition(x, y) {
    this._container.setPosition(x, y);
    return this;
  }

  setDepth(d) {
    this._container.setDepth(d);
    return this;
  }

  destroy() {
    this._container.destroy();
  }
}

/** Small icon button (circular) */
export class IconButton {
  constructor(scene, x, y, icon, onClick, color = CONFIG.COLORS.NEON_CYAN, depth = 60) {
    this._scene = scene;
    this._container = scene.add.container(x, y).setDepth(depth);

    const bg = scene.add.graphics();
    bg.fillStyle(0x16213e, 0.9);
    bg.fillCircle(0, 0, 26);
    bg.lineStyle(2, color, 0.8);
    bg.strokeCircle(0, 0, 26);

    const lbl = scene.add.text(0, 0, icon, {
      font: '20px sans-serif',
    }).setOrigin(0.5);

    const zone = scene.add.zone(0, 0, 52, 52).setInteractive({ useHandCursor: true });

    this._container.add([bg, lbl, zone]);

    zone.on('pointerover', () => {
      scene.tweens.add({ targets: this._container, scale: 1.15, duration: 100 });
    });
    zone.on('pointerout', () => {
      scene.tweens.add({ targets: this._container, scale: 1.0, duration: 100 });
    });
    zone.on('pointerup', () => {
      bus.emit('sfx:play', { key: 'sfx_click' });
      onClick();
    });
  }

  destroy() { this._container.destroy(); }
}
