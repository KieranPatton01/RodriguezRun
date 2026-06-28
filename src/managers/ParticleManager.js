// =============================================================
// ParticleManager.js — Centralized particle effects
// Manages emitter references and burst helpers
// =============================================================

import { CONFIG } from '../config.js';
import { bus } from '../utils/EventBus.js';

export class ParticleManager {
  constructor(scene) {
    this._scene = scene;
    this._emitters = {};
    this._confettiParticles = [];

    bus.on('particle:coinBurst', ({ x, y }) => this.coinBurst(x, y));
    bus.on('particle:gemBurst', ({ x, y }) => this.gemBurst(x, y));
    bus.on('particle:explosion', ({ x, y }) => this.explosion(x, y));
    bus.on('particle:speedLines', ({ active }) => this.toggleSpeedLines(active));
    bus.on('particle:shieldHit', ({ x, y }) => this.shieldHit(x, y));
  }

  /** Spark burst when collecting a coin */
  coinBurst(x, y) {
    const particles = this._scene.add.particles(x, y, 'particle_star', {
      speed: { min: 60, max: 160 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: CONFIG.COLORS.COIN,
      lifespan: 400,
      quantity: 6,
      angle: { min: 0, max: 360 },
    });
    this._scene.time.delayedCall(500, () => particles.destroy());
  }

  /** Rainbow burst for gems */
  gemBurst(x, y) {
    const colors = [0xff006e, 0xff6b35, 0xffbe0b, 0x06d6a0, 0x00d4ff, 0x8338ec];
    colors.forEach((tint, i) => {
      this._scene.time.delayedCall(i * 30, () => {
        const p = this._scene.add.particles(x, y, 'particle_star', {
          speed: { min: 80, max: 200 },
          scale: { start: 0.7, end: 0 },
          lifespan: 600,
          quantity: 4,
          tint,
          angle: { min: 0, max: 360 },
        });
        this._scene.time.delayedCall(700, () => p.destroy());
      });
    });
  }

  /** Obstacle collision explosion */
  explosion(x, y) {
    const p = this._scene.add.particles(x, y, 'particle_square', {
      speed: { min: 100, max: 300 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xff6b35, 0xffbe0b, 0xff006e],
      lifespan: 500,
      quantity: 16,
      angle: { min: 0, max: 360 },
      gravityY: 400,
    });
    this._scene.time.delayedCall(600, () => p.destroy());
  }

  /** Shield absorption flash */
  shieldHit(x, y) {
    const p = this._scene.add.particles(x, y, 'particle_star', {
      speed: { min: 150, max: 280 },
      scale: { start: 0.6, end: 0 },
      tint: CONFIG.COLORS.NEON_CYAN,
      lifespan: 400,
      quantity: 12,
      angle: { min: 0, max: 360 },
    });
    this._scene.time.delayedCall(500, () => p.destroy());
  }

  /** Speed lines overlay emitter */
  toggleSpeedLines(active) {
    if (active && !this._speedLines) {
      this._speedLines = this._scene.add.particles(CONFIG.WIDTH + 50, CONFIG.HEIGHT / 2, 'particle_square', {
        speedX: { min: -1200, max: -800 },
        speedY: { min: -20, max: 20 },
        scaleX: { start: 3, end: 0 },
        scaleY: 0.08,
        alpha: { start: 0.4, end: 0 },
        tint: CONFIG.COLORS.NEON_CYAN,
        lifespan: 300,
        frequency: 30,
        quantity: 2,
      }).setDepth(20);
    } else if (!active && this._speedLines) {
      this._speedLines.destroy();
      this._speedLines = null;
    }
  }

  /** Confetti burst for new high score */
  confetti() {
    const colors = [0xff006e, 0xffbe0b, 0x00d4ff, 0x06d6a0, 0x8338ec, 0xff6b35];
    for (let i = 0; i < 80; i++) {
      this._scene.time.delayedCall(Math.random() * 800, () => {
        const x = Math.random() * CONFIG.WIDTH;
        const p = this._scene.add.particles(x, -20, 'particle_square', {
          speedX: { min: -80, max: 80 },
          speedY: { min: 200, max: 500 },
          scale: { min: 0.3, max: 0.8 },
          tint: colors[Math.floor(Math.random() * colors.length)],
          lifespan: 2500,
          quantity: 1,
          gravityY: 300,
          rotate: { min: 0, max: 360 },
        }).setDepth(100);
        this._scene.time.delayedCall(2600, () => p.destroy());
      });
    }
  }

  /** Player run trail */
  createTrail(followTarget) {
    if (this._trail) this._trail.destroy();
    this._trail = this._scene.add.particles(0, 0, 'particle_square', {
      follow: followTarget,
      followOffset: { x: -10, y: 20 },
      speedX: { min: -30, max: -80 },
      speedY: { min: -20, max: 20 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: CONFIG.COLORS.PLAYER_BODY,
      lifespan: 200,
      frequency: 40,
    }).setDepth(4);
    return this._trail;
  }

  destroyTrail() {
    if (this._trail) { this._trail.destroy(); this._trail = null; }
  }
}
