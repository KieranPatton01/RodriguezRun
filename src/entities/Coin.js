// =============================================================
// Coin.js — Poolable collectible coin
// Supports magnet attraction and sparkle animation
// =============================================================

import { CONFIG } from '../config.js';
import { Projection } from '../utils/Projection.js';

export class Coin {
  constructor(scene) {
    this._scene = scene;
    this._container = scene.add.container(0, 0).setVisible(false).setDepth(0);
    this._gfx = scene.add.graphics();
    this._text = scene.add.text(0, 0, '€', {
      fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', fill: '#f1c40f'
    }).setOrigin(0.5);
    this._container.add([this._gfx, this._text]);
    
    this._hitbox = scene.add.rectangle(0, 0, 24, 24, 0xffff00, 0);
    this.active = false;
    this._spin = 0;
    this._bobOffset = Math.random() * Math.PI * 2;
    this._magnetTarget = null;
    this.worldX = 0;
    this.worldY = 0;
    this.z = 0;
  }

  activate(worldX, worldY, z) {
    this.active = true;
    this.worldX = worldX;
    this.worldY = worldY;
    this.z = z;

    this._container.setVisible(true);
    this._spin = 0;
    this._magnetTarget = null;
    this._draw();
  }

  updatePosition(screenW, screenH) {
    const proj = Projection.project(this.worldX, this.worldY, this.z, screenW, screenH);
    this._container.x = proj.x;
    this._container.y = proj.y - 24 * proj.scale + Math.sin(this._bobOffset) * 5 * proj.scale;
    this._container.scale = proj.scale;
    this._container.setDepth(10000 - this.z);

    this._hitbox.x = proj.x;
    this._hitbox.y = proj.y - 24 * proj.scale;
    this._hitbox.scale = proj.scale;
  }

  _draw() {
    const g = this._gfx;
    g.clear();
    const spin = this._spin;
    const scaleX = Math.cos(spin); // Coin spin illusion
    const halfW = 12 * Math.abs(scaleX);
    const C = CONFIG.COLORS;

    // Glow
    g.fillStyle(C.COIN, 0.2);
    g.fillCircle(0, 0, 18);

    if (scaleX >= 0) {
      g.fillStyle(C.COIN, 1);
    } else {
      g.fillStyle(0xcc9900, 1); // darker edge when flipped
    }

    // Coin face
    g.fillEllipse(0, 0, halfW * 2, 24);

    // Inner emblem
    if (Math.abs(scaleX) > 0.3) {
      g.fillStyle(0xcc8800, 1);
      g.fillEllipse(0, 0, halfW * 1.1, 14);
      this._text.setVisible(true);
      this._text.scaleX = scaleX;
    } else {
      this._text.setVisible(false);
    }

    // Rim highlight
    g.lineStyle(1.5, 0xffe066, 0.9);
    g.strokeEllipse(0, 0, halfW * 2, 24);
  }

  update(delta, worldSpeed, playerX, playerY, playerZ, magnetActive) {
    if (!this.active) return;

    // Scroll with world
    this.z -= worldSpeed * (delta / 1000);

    // Bob up and down
    this._bobOffset += delta * 0.003;

    // Spin animation
    this._spin += delta * 0.004;
    this._draw();

    // Magnet attraction
    if (magnetActive) {
      const dx = playerX - this.worldX;
      const dy = playerY - this.worldY;
      const dz = playerZ - this.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < CONFIG.POWERUP.MAGNET_RADIUS * 6) {
        const speed = 2500;
        this.worldX += (dx / dist) * speed * (delta / 1000);
        this.worldY += (dy / dist) * speed * (delta / 1000);
        this.z += (dz / dist) * speed * (delta / 1000);
      }
    }

    const screenW = this._scene.sys.game.canvas.width;
    const screenH = this._scene.sys.game.canvas.height;
    this.updatePosition(screenW, screenH);
  }

  set x(v) { this._container.x = v; this._hitbox.x = v; }
  get x() { return this._container.x; }
  get y() { return this._container.y; }
  get active() { return this._active; }
  set active(v) { this._active = v; }
  get hitbox() { return this._hitbox; }
  get _poolType() { return 'coin'; }

  deactivate() {
    this.active = false;
    this._container.setVisible(false);
  }
}
