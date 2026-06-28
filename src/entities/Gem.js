// =============================================================
// Gem.js — Rare collectible gem
// Rainbow shimmer effect, high value
// =============================================================

import { CONFIG } from '../config.js';
import { Projection } from '../utils/Projection.js';

const GEM_COLORS = [0xff006e, 0xffbe0b, 0x00d4ff, 0x06d6a0, 0x8338ec, 0xff6b35];

export class Gem {
  constructor(scene) {
    this._scene = scene;
    this._gfx = scene.add.graphics().setVisible(false);
    this._hitbox = scene.add.rectangle(0, 0, 28, 28, 0xff00ff, 0);
    this.active = false;
    this._t = 0;
    this._colorIdx = 0;
    this.worldX = 0;
    this.worldY = 0;
    this.z = 0;
  }

  activate(worldX, worldY, z) {
    this.active = true;
    this.worldX = worldX;
    this.worldY = worldY;
    this.z = z;
    this._gfx.setVisible(true);
    this._t = 0;
    this._draw();
  }

  updatePosition(screenW, screenH) {
    const proj = Projection.project(this.worldX, this.worldY, this.z, screenW, screenH);
    this._gfx.x = proj.x;
    this._gfx.y = proj.y - 24 * proj.scale + Math.sin(this._t * 3) * 8 * proj.scale;
    this._gfx.scale = proj.scale;
    this._gfx.setDepth(10000 - this.z);
    
    this._gfx.angle = Math.sin(this._t) * 15;

    this._hitbox.x = proj.x;
    this._hitbox.y = proj.y - 24 * proj.scale;
    this._hitbox.scale = proj.scale;
  }

  _draw() {
    const g = this._gfx;
    g.clear();
    const ci = Math.floor(this._t * 3) % GEM_COLORS.length;
    const c = GEM_COLORS[ci];
    const cn = GEM_COLORS[(ci + 1) % GEM_COLORS.length];
    const pulse = (Math.sin(this._t * Math.PI * 2) + 1) / 2;

    // Glow
    g.fillStyle(c, 0.25 * pulse + 0.1);
    g.fillCircle(0, 0, 22);
    g.fillStyle(cn, 0.1);
    g.fillCircle(0, 0, 26);

    // Gem body (diamond shape)
    const size = 13;
    g.fillStyle(c, 1);
    g.fillTriangle(0, -size, -size * 0.7, 0, size * 0.7, 0); // top half
    g.fillStyle(cn, 0.85);
    g.fillTriangle(-size * 0.7, 0, 0, size, size * 0.7, 0);  // bottom half

    // Inner facets
    g.lineStyle(1, 0xffffff, 0.5 * pulse);
    g.lineBetween(0, -size, 0, size);
    g.lineBetween(-size * 0.7, 0, size * 0.7, 0);

    // Sparkle
    if (pulse > 0.8) {
      g.fillStyle(0xffffff, pulse - 0.8);
      g.fillCircle(-6, -6, 2);
      g.fillCircle(5, -3, 1.5);
    }
  }

  update(delta, worldSpeed) {
    if (!this.active) return;
    this.z -= worldSpeed * (delta / 1000);
    this._t += delta * 0.001;
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
  get _poolType() { return 'gem'; }

  deactivate() {
    this.active = false;
    this._gfx.setVisible(false);
  }
}
