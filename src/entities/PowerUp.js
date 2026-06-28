// =============================================================
// PowerUp.js — Poolable powerup collectible
// Glows and pulses to attract the player
// =============================================================

import { CONFIG, POWERUP_TYPES } from '../config.js';
import { Projection } from '../utils/Projection.js';

export class PowerUp {
  constructor(scene) {
    this._scene = scene;
    this._gfx = scene.add.graphics().setVisible(false);
    this._hitbox = scene.add.rectangle(0, 0, 32, 32, 0x00ff00, 0);
    this.active = false;
    this._pulsT = 0;
    this._typeData = null;
    this.worldX = 0;
    this.worldY = 0;
    this.z = 0;
  }

  activate(worldX, worldY, z, typeData) {
    this.active = true;
    this._typeData = typeData;
    this.worldX = worldX;
    this.worldY = worldY;
    this.z = z;

    this._gfx.setVisible(true);
    this._pulsT = 0;
    this._draw();
  }

  updatePosition(screenW, screenH) {
    const proj = Projection.project(this.worldX, this.worldY, this.z, screenW, screenH);
    this._gfx.x = proj.x;
    this._gfx.y = proj.y - 24 * proj.scale + Math.sin(this._pulsT * 1.5) * 6 * proj.scale;
    this._gfx.scale = proj.scale;
    this._gfx.setDepth(10000 - this.z);

    this._hitbox.x = proj.x;
    this._hitbox.y = proj.y - 24 * proj.scale;
    this._hitbox.scale = proj.scale;
  }

  _draw() {
    const g = this._gfx;
    g.clear();
    if (!this._typeData) return;
    const c = this._typeData.color;
    const pulse = Math.sin(this._pulsT) * 0.3 + 0.7;

    // Outer glow
    g.fillStyle(c, 0.15 * pulse);
    g.fillCircle(0, 0, 28);

    // Outer ring
    g.lineStyle(2, c, 0.8 * pulse);
    g.strokeCircle(0, 0, 20);

    // Body
    g.fillStyle(0x0d1b2a, 1);
    g.fillCircle(0, 0, 17);

    // Icon per type
    g.fillStyle(c, pulse);
    const key = this._typeData.key;
    if (key === 'pu_magnet') {
      // Horseshoe magnet
      g.lineStyle(5, c, 1);
      g.beginPath();
      g.arc(0, 0, 10, Math.PI, 0, false);
      g.strokePath();
      g.fillRect(-13, -2, 6, 8);
      g.fillRect(7, -2, 6, 8);
    } else if (key === 'pu_double') {
      // '2x' text simulated as shapes
      g.fillRect(-10, -8, 6, 16); // left bar
      g.fillRect(-4, -8, 12, 5);  // top bar of x
      g.fillRect(-4, 3, 12, 5);   // bottom bar
    } else if (key === 'pu_shield') {
      // Shield shape
      g.fillTriangle(0, -12, -11, -4, 11, -4);
      g.fillRect(-11, -4, 22, 12);
      g.fillTriangle(-11, 8, 0, 14, 11, 8);
    } else if (key === 'pu_slow') {
      // Hourglass
      g.fillTriangle(-9, -12, 9, -12, 0, 0);
      g.fillTriangle(-9, 12, 9, 12, 0, 0);
      g.fillRect(-9, -14, 18, 4);
      g.fillRect(-9, 10, 18, 4);
    } else if (key === 'pu_speed') {
      // Lightning bolt
      g.fillTriangle(4, -13, -5, 1, 2, 1);
      g.fillTriangle(2, 1, -7, 1, -3, 13);
    } else if (key === 'pu_hoverboard') {
      // Board shape
      g.fillRoundedRect(-13, -5, 26, 10, 4);
      g.fillStyle(0x001100, 1);
      g.fillCircle(-8, 0, 3);
      g.fillCircle(8, 0, 3);
    }

    // Label hint
    g.lineStyle(1, c, 0.5);
    g.strokeCircle(0, 0, 21);
  }

  update(delta, worldSpeed) {
    if (!this.active) return;
    this.z -= worldSpeed * (delta / 1000);
    this._pulsT += delta * 0.005;
    this._draw();

    const screenW = this._scene.sys.game.canvas.width;
    const screenH = this._scene.sys.game.canvas.height;
    this.updatePosition(screenW, screenH);
  }

  set x(v) { this._gfx.x = v; this._hitbox.x = v; }
  get x() { return this._gfx.x; }
  get y() { return this._gfx.y; }
  get active() { return this._active; }
  set active(v) { this._active = v; }
  get hitbox() { return this._hitbox; }
  get typeData() { return this._typeData; }
  get _poolType() { return 'powerup'; }

  deactivate() {
    this.active = false;
    this._gfx.setVisible(false);
  }
}
