// =============================================================
// DifficultyManager.js — Smooth difficulty curve
// Emits tier-change events so other managers can react
// =============================================================

import { CONFIG } from '../config.js';
import { mapRangeClamped } from '../utils/MathUtils.js';
import { bus } from '../utils/EventBus.js';

const TIERS = [
  CONFIG.DIFFICULTY.TIER_1,
  CONFIG.DIFFICULTY.TIER_2,
  CONFIG.DIFFICULTY.TIER_3,
  CONFIG.DIFFICULTY.TIER_4,
  CONFIG.DIFFICULTY.TIER_5,
];

export class DifficultyManager {
  constructor() {
    this._elapsed = 0;   // seconds since game start
    this._tier = 1;
    this._speed = CONFIG.WORLD.INITIAL_SPEED;
    this._density = 0.6;
    this._movingHazards = false;
  }

  update(delta) {
    this._elapsed += delta / 1000;
    this._updateSpeed();
    this._updateTier();
  }

  _updateSpeed() {
    this._speed = mapRangeClamped(
      this._elapsed,
      0, CONFIG.WORLD.SPEED_RAMP_DURATION,
      CONFIG.WORLD.INITIAL_SPEED, CONFIG.WORLD.MAX_SPEED
    );
  }

  _updateTier() {
    let newTier = 1;
    for (let i = 0; i < TIERS.length; i++) {
      if (this._elapsed >= TIERS[i].timeStart) newTier = i + 1;
    }
    if (newTier !== this._tier) {
      this._tier = newTier;
      const cfg = TIERS[newTier - 1];
      this._density = cfg.density;
      this._movingHazards = cfg.moving;
      bus.emit('difficulty:tierChange', { tier: newTier, cfg });
    }
  }

  get speed()        { return this._speed; }
  get density()      { return this._density; }
  get tier()         { return this._tier; }
  get movingHazards(){ return this._movingHazards; }
  get elapsed()      { return this._elapsed; }

  /** Spawn interval in ms, adjusted by density */
  get obstacleInterval() {
    const base = mapRangeClamped(this._tier, 1, 5,
      CONFIG.SPAWN.OBSTACLE_MAX, CONFIG.SPAWN.OBSTACLE_MIN);
    return (base / this._density) * 1000;
  }

  get coinInterval() {
    return mapRangeClamped(this._tier, 1, 5,
      CONFIG.SPAWN.COIN_MAX, CONFIG.SPAWN.COIN_MIN) * 1000;
  }
}
