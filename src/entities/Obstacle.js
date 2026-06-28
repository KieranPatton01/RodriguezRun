// =============================================================
// Obstacle.js — Poolable obstacle entity
// Draws itself programmatically based on obstacle type key
// =============================================================

import { CONFIG } from '../config.js';
import { Projection } from '../utils/Projection.js';

const OBSTACLE_COLORS = {
  terrace:     { main: 0xc0392b, accent: 0x2c3e50, stripe: 0xecf0f1 }, // Red cafe chairs, slate table
  fountain:    { main: 0x95a5a6, accent: 0x3498db, stripe: 0xecf0f1 }, // Stone and water
  olive_tree:  { main: 0x27ae60, accent: 0x8b5a2b, stripe: 0xcda077 }, // Olive leaves, terracotta pot
  churro_cart: { main: 0xe67e22, accent: 0xf1c40f, stripe: 0xc0392b }, // Warm churro colors, red canopy
  vespa:       { main: 0x2980b9, accent: 0xbdc3c7, stripe: 0x1a1a1a }, // Blue scooter
  flamenco:    { main: 0xc0392b, accent: 0x000000, stripe: 0xf1c40f }, // Red dress, black hair, gold trim
  bull:        { main: 0x2c3e50, accent: 0x7f8c8d, stripe: 0xc0392b }, // Dark grey/black bull
  pigeons:     { main: 0x7f8c8d, accent: 0xbdc3c7, stripe: 0x95a5a6 }, // Grey birds
  tranvia:     { main: 0x2c3e50, accent: 0xc0392b, stripe: 0xf1c40f }, // Classic red/slate Madrid streetcar
  stairs:      { main: 0x95a5a6, accent: 0x7f8c8d, stripe: 0xbdc3c7 }, // Stone stairs
};

export class Obstacle {
  constructor(scene) {
    this._scene = scene;
    this._gfx = scene.add.graphics().setDepth(8).setVisible(false);
    this._gfx._poolType = 'obstacle';
    this._hitbox = scene.add.rectangle(0, 0, 40, 60, 0xff0000, 0).setDepth(9);
    this.active = false;
    this.moveData = null;
    this._key = null;
    this._typeDef = null;
    this.worldX = 0;
    this.worldY = 0;
    this.z = 0;
  }

  activate(worldX, groundY, z, key, typeDef, lane) {
    this._key = key;
    this._typeDef = typeDef;
    this.active = true;
    this._gfx.setVisible(true);
    
    this.worldX = worldX;
    this.worldY = groundY;
    this.z = z;
    
    this._hitbox.width  = (typeDef.w || 40) * 0.75; // slightly inset for fairness
    this._hitbox.height = (typeDef.h || 60) * 0.75;
    this._draw(key);
  }

  updatePosition(screenW, screenH) {
    const proj = Projection.project(this.worldX, this.worldY, this.z, screenW, screenH);
    this._gfx.x = proj.x;
    this._gfx.y = proj.y - (this._typeDef.h || 60) * proj.scale;
    this._gfx.scale = proj.scale;
    this._gfx.setDepth(10000 - this.z);

    this._hitbox.x = proj.x;
    this._hitbox.y = proj.y - ((this._typeDef.h || 60) / 2) * proj.scale;
    this._hitbox.scale = proj.scale;
  }

  _draw(key) {
    const g = this._gfx;
    g.clear();
    const c = OBSTACLE_COLORS[key] || OBSTACLE_COLORS.barrier;
    const T = this._typeDef;
    const w = T.w, h = T.h;

    switch (key) {
      case 'terrace':     this._drawTerrace(g, w, h, c); break;
      case 'fountain':    this._drawFountain(g, w, h, c); break;
      case 'olive_tree':  this._drawOliveTree(g, w, h, c); break;
      case 'churro_cart': this._drawChurroCart(g, w, h, c); break;
      case 'vespa':       this._drawVespa(g, w, h, c); break;
      case 'flamenco':    this._drawFlamenco(g, w, h, c); break;
      case 'bull':        this._drawBull(g, w, h, c); break;
      case 'pigeons':     this._drawPigeons(g, w, h, c); break;
      case 'tranvia':     this._drawTranvia(g, w, h, c); break;
      case 'stairs':      this._drawStairs(g, w, h, c); break;
      default:            this._drawTerrace(g, w, h, c); break;
    }
  }

  _drawTerrace(g, w, h, c) {
    // Cafe Terrace (Red chairs, table)
    g.fillStyle(c.accent, 1); // slate table
    g.fillEllipse(0, h * 0.4, w, 20); // tabletop
    g.fillStyle(c.stripe, 1); // white tablecloth
    g.fillEllipse(0, h * 0.4, w * 0.9, 16);
    g.fillStyle(c.main, 1); // red chairs
    g.fillRect(-w/2 - 5, h * 0.2, 10, h * 0.4);
    g.fillRect(w/2 - 5, h * 0.2, 10, h * 0.4);
    // Table legs
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(-2, h * 0.4, 4, h * 0.6);
  }

  _drawFountain(g, w, h, c) {
    // Plaza Fountain
    g.fillStyle(c.main, 1); // stone base
    g.fillRoundedRect(-w/2, h * 0.7, w, h * 0.3, 5);
    g.fillRoundedRect(-w/4, h * 0.3, w/2, h * 0.4, 3);
    g.fillEllipse(0, h * 0.3, w * 0.6, 16); // top tier
    // Water
    g.fillStyle(c.accent, 0.8);
    g.fillEllipse(0, h * 0.7, w * 0.9, 20); // bottom pool
    // Spray
    g.fillStyle(c.stripe, 0.6);
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(-15, h * 0.3); g.lineTo(15, h * 0.3);
    g.closePath();
    g.fillPath();
  }

  _drawOliveTree(g, w, h, c) {
    // Olive tree in terracotta planter
    g.fillStyle(c.stripe, 1); // terracotta pot
    g.fillRoundedRect(-w/2, h * 0.6, w, h * 0.4, 6);
    // Soil
    g.fillStyle(0x3d2010, 1);
    g.fillRect(-w/2 + 4, h * 0.6, w - 8, 8);
    // Trunk
    g.fillStyle(c.accent, 1);
    g.fillRect(-4, h * 0.4, 8, h * 0.2);
    // Leaves (olive green)
    g.fillStyle(c.main, 1);
    g.fillCircle(0, h * 0.2, w * 0.5);
    g.fillCircle(-w * 0.25, h * 0.3, w * 0.35);
    g.fillCircle(w * 0.25, h * 0.3, w * 0.35);
  }

  _drawChurroCart(g, w, h, c) {
    // Churro cart
    // Wheels
    g.fillStyle(0x223344, 1);
    g.fillCircle(-w/2 + 10, h, 12);
    g.fillCircle(w/2 - 10, h, 12);
    // Body (warm orange)
    g.fillStyle(c.main, 1);
    g.fillRoundedRect(-w/2, h * 0.3, w, h * 0.7, 4);
    // Red Canopy
    g.fillStyle(c.stripe, 1);
    g.fillTriangle(-w/2 - 10, h * 0.3, w/2 + 10, h * 0.3, 0, 0);
    // Yellow stripes on canopy
    g.fillStyle(c.accent, 1);
    g.fillTriangle(-w/4, h * 0.3, w/4, h * 0.3, 0, 0);
    // Counter
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(-w/2 + 4, h * 0.3, w - 8, 8);
    // Sign "CHURROS" (stylized lines)
    g.fillStyle(c.accent, 1);
    g.fillRect(-w/2 + 8, h * 0.5, w - 16, 6);
  }

  _drawVespa(g, w, h, c) {
    // Blue Scooter
    const cy = h * 0.7; // wheel height
    // Wheels
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(-w/2 + 10, cy, 14);
    g.fillCircle(w/2 - 10, cy, 14);
    g.fillStyle(c.accent, 1); // hubs
    g.fillCircle(-w/2 + 10, cy, 6);
    g.fillCircle(w/2 - 10, cy, 6);
    // Body / Frame (blue)
    g.fillStyle(c.main, 1);
    g.fillRoundedRect(-w/2 + 15, cy - 20, w - 25, 20, 5); // base
    g.fillRoundedRect(-w/2 + 5, cy - 40, 20, 30, 4); // back wheel cover
    g.fillRoundedRect(w/2 - 20, cy - 50, 15, 40, 4); // front steering column
    // Seat (dark leather)
    g.fillStyle(0x3e2723, 1);
    g.fillRoundedRect(-w/2 + 10, cy - 45, 30, 10, 3);
    // Headlight
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(w/2 - 12, cy - 40, 6);
  }

  _drawFlamenco(g, w, h, c) {
    // Flamenco Dancer
    const bodyW = 20;
    // Dress Skirt (Red ruffles)
    g.fillStyle(c.main, 1);
    g.beginPath();
    g.moveTo(0, h * 0.4);
    g.lineTo(-w/2, h);
    g.lineTo(w/2, h);
    g.closePath();
    g.fillPath();
    // Gold trim on ruffles
    g.lineStyle(3, c.stripe, 1);
    g.beginPath();
    g.moveTo(-w/2 + 5, h - 10);
    g.lineTo(w/2 - 5, h - 10);
    g.strokePath();
    // Torso
    g.fillStyle(c.main, 1);
    g.fillRoundedRect(-10, h * 0.2, 20, h * 0.3, 4);
    // Arms up (dancing)
    g.fillStyle(0xf5c8a0, 1); // skin tone
    g.lineStyle(4, 0xf5c8a0, 1);
    g.beginPath();
    g.moveTo(-10, h * 0.25);
    g.lineTo(-20, h * 0.1);
    g.moveTo(10, h * 0.25);
    g.lineTo(20, h * 0.1);
    g.strokePath();
    // Castanets
    g.fillStyle(0x3e2723, 1);
    g.fillCircle(-20, h * 0.1, 4);
    g.fillCircle(20, h * 0.1, 4);
    // Head
    g.fillStyle(0xf5c8a0, 1);
    g.fillCircle(0, h * 0.1, 10);
    // Hair (black bun with flower)
    g.fillStyle(c.accent, 1); // black hair
    g.fillCircle(0, h * 0.05, 11);
    g.fillCircle(-8, h * 0.05, 6); // bun
    // Flower
    g.fillStyle(c.main, 1);
    g.fillCircle(-8, h * 0.05, 3);
  }

  _drawBull(g, w, h, c) {
    // Running Bull (Dark grey/black)
    // Body
    g.fillStyle(c.main, 1);
    g.fillRoundedRect(-w/2, h * 0.4, w, h * 0.4, 10);
    // Hump
    g.fillEllipse(-w/4, h * 0.35, 25, 20);
    // Legs (animated gallop could be added here later)
    g.fillStyle(c.accent, 1);
    const legSwing = Math.sin(Date.now() * 0.01) * 6;
    g.fillRect(-w/2 + 5 + legSwing, h * 0.8, 8, h * 0.2);
    g.fillRect(w/2 - 15 - legSwing, h * 0.8, 8, h * 0.2);
    g.fillRect(-w/4 - legSwing, h * 0.8, 8, h * 0.2);
    g.fillRect(w/4 + legSwing, h * 0.8, 8, h * 0.2);
    // Head
    g.fillStyle(c.main, 1);
    g.fillRoundedRect(w/2 - 10, h * 0.3, 20, 25, 4);
    // Horns
    g.fillStyle(0xecf0f1, 1);
    g.beginPath();
    g.moveTo(w/2 - 5, h * 0.3); g.lineTo(w/2 - 15, h * 0.1); g.lineTo(w/2, h * 0.3);
    g.moveTo(w/2 + 5, h * 0.3); g.lineTo(w/2 + 15, h * 0.1); g.lineTo(w/2, h * 0.3);
    g.closePath();
    g.fillPath();
    // Eye (red)
    g.fillStyle(c.stripe, 1);
    g.fillCircle(w/2, h * 0.4, 3);
  }

  _drawPigeons(g, w, h, c) {
    // Flock of pigeons (animated flying)
    const t = Date.now() * 0.005;
    for (let i = 0; i < 4; i++) {
      const px = -w/2 + i * (w/3) + Math.cos(t + i) * 10;
      const py = h/2 + Math.sin(t * 1.5 + i * 2) * 10;
      // Pigeon body
      g.fillStyle(c.main, 1);
      g.fillEllipse(px, py, 16, 8);
      // Wings flapping
      const wingY = Math.sin(t * 8 + i) * 10;
      g.fillStyle(c.accent, 1);
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px - 10, py - wingY);
      g.lineTo(px + 5, py);
      g.closePath();
      g.fillPath();
      // Eye
      g.fillStyle(c.stripe, 1);
      g.fillCircle(px + 5, py - 2, 1.5);
    }
  }

  _drawTranvia(g, w, h, c) {
    // Classic Madrid Streetcar (Red and slate)
    // Body
    g.fillStyle(c.main, 1); // slate lower half
    g.fillRoundedRect(-w/2, h * 0.6, w, h * 0.35, 4);
    g.fillStyle(c.accent, 1); // red upper half
    g.fillRoundedRect(-w/2, 0, w, h * 0.6, 10);
    // Windows
    g.fillStyle(0x87ceeb, 0.4); // light blue glass
    for (let i = 0; i < 3; i++) {
      g.fillRoundedRect(-w/2 + 6 + i * (w/3 + 2), h * 0.15, w/3 - 8, h * 0.3, 4);
    }
    // Gold stripe
    g.fillStyle(c.stripe, 1);
    g.fillRect(-w/2, h * 0.55, w, 4);
    // Wheels
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(-w/2 + 15, h * 0.95, 12);
    g.fillCircle(w/2 - 15, h * 0.95, 12);
    // Pantograph (roof connector)
    g.lineStyle(2, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(-10, 0); g.lineTo(0, -20); g.lineTo(10, 0);
    g.moveTo(-15, -20); g.lineTo(15, -20);
    g.strokePath();
    // Headlights
    g.fillStyle(0xf1c40f, 0.9);
    g.fillCircle(-w/2 + 10, h * 0.7, 6);
    g.fillCircle(w/2 - 10, h * 0.7, 6);
  }

  _drawStairs(g, w, h, c) {
    // Stone Stairs (replaces ramp)
    g.fillStyle(c.main, 1);
    
    // Top width is narrower to simulate distance
    const topW = w * 0.4;
    
    // Draw steps instead of smooth ramp
    const numSteps = 5;
    for (let i = 0; i < numSteps; i++) {
      const t1 = i / numSteps;
      const t2 = (i + 1) / numSteps;
      
      const y1 = h * (1 - t1);
      const y2 = h * (1 - t2);
      
      const w1 = w * (1 - t1) + topW * t1;
      const w2 = w * (1 - t2) + topW * t2;
      
      // Step riser (front face)
      g.fillStyle(c.accent, 1);
      g.fillRect(-w1/2, y1 - (y1-y2), w1, y1-y2);
      
      // Step tread (top face)
      g.fillStyle(c.main, 1);
      g.beginPath();
      g.moveTo(-w1/2, y1 - (y1-y2));
      g.lineTo(w1/2, y1 - (y1-y2));
      g.lineTo(w2/2, y2);
      g.lineTo(-w2/2, y2);
      g.closePath();
      g.fillPath();

      // Glowing up-arrows on risers
      if (i % 2 === 0) {
        g.fillStyle(0x00ff00, 0.8);
        const arrowY = y1 - (y1-y2)/2;
        g.beginPath();
        g.moveTo(0, arrowY - 4);
        g.lineTo(-6, arrowY + 2);
        g.lineTo(-2, arrowY + 2);
        g.lineTo(-2, arrowY + 6);
        g.lineTo(2, arrowY + 6);
        g.lineTo(2, arrowY + 2);
        g.lineTo(6, arrowY + 2);
        g.closePath();
        g.fillPath();
      }
    }
  }

  set x(v) { this._gfx.x = v; this._hitbox.x = v; }
  set y(v) {
    this._gfx.y = v;
    this._hitbox.y = v + (this._typeDef?.h || 60) / 2;
  }
  get x() { return this._gfx.x; }
  get y() { return this._gfx.y; }
  get active() { return this._active; }
  set active(v) { this._active = v; }
  get hitbox() { return this._hitbox; }
  get typeDef() { return this._typeDef; }
  get _poolType() { return 'obstacle'; }

  deactivate() {
    this.active = false;
    this._gfx.setVisible(false);
    this.moveData = null;
  }

  destroy() {
    this._gfx.destroy();
    this._hitbox.destroy();
  }
}
