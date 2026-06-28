// =============================================================
// ScoreManager.js — Score, combo, distance tracking
// =============================================================

import { CONFIG } from '../config.js';
import { clamp } from '../utils/MathUtils.js';
import { bus } from '../utils/EventBus.js';

const { SCORE } = CONFIG;

export class ScoreManager {
  constructor() {
    this.reset();
    bus.on('coin:collected', () => this.addCoin());
    bus.on('gem:collected', () => this.addGem());
    bus.on('player:stumble', () => this._breakCombo());
  }

  reset() {
    this._score = 0;
    this._displayScore = 0;
    this._coins = 0;
    this._distance = 0;
    this._comboCount = 0;
    this._comboTimer = 0;
    this._multiplierIndex = -1; // -1 = x1
    this._doubleScore = false;
    this._peakCombo = 0;
  }

  update(delta, worldSpeed) {
    // Distance score from running
    const metersPerSecond = worldSpeed / 10;
    const gained = (metersPerSecond * delta / 1000) * SCORE.DISTANCE_PER_METER;
    this._distance += gained;
    const scoreGain = gained * this.multiplier * (this._doubleScore ? 2 : 1);
    this._score += scoreGain;

    // Combo timer decay
    if (this._comboCount > 0) {
      this._comboTimer -= delta;
      if (this._comboTimer <= 0) this._breakCombo();
    }

    // Smooth display score
    this._displayScore += (this._score - this._displayScore) * 0.15;
  }

  addCoin() {
    this._coins++;
    this._comboCount++;
    if (this._comboCount > this._peakCombo) this._peakCombo = this._comboCount;
    this._comboTimer = SCORE.COMBO_RESET_TIME;
    this._score += SCORE.COIN_VALUE * this.multiplier * (this._doubleScore ? 2 : 1);
    this._updateMultiplier();
    bus.emit('score:update', { score: this.displayScore, combo: this._comboCount, multiplier: this.multiplier });
  }

  addGem() {
    this._score += SCORE.GEM_VALUE * this.multiplier * (this._doubleScore ? 2 : 1);
    bus.emit('score:gem', { score: this.displayScore });
  }

  _updateMultiplier() {
    for (let i = SCORE.COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this._comboCount >= SCORE.COMBO_THRESHOLDS[i]) {
        if (i !== this._multiplierIndex) {
          this._multiplierIndex = i;
          bus.emit('score:comboUp', { multiplier: this.multiplier, index: i });
        }
        return;
      }
    }
    this._multiplierIndex = -1;
  }

  _breakCombo() {
    if (this._comboCount === 0) return;
    this._comboCount = 0;
    this._comboTimer = 0;
    this._multiplierIndex = -1;
    bus.emit('score:comboBreak');
  }

  setDoubleScore(v) { this._doubleScore = v; }

  get score()        { return Math.floor(this._score); }
  get displayScore() { return Math.floor(this._displayScore); }
  get coins()        { return this._coins; }
  get distance()     { return Math.floor(this._distance); }
  get comboCount()   { return this._comboCount; }
  get peakCombo()    { return this._peakCombo; }
  get multiplier() {
    if (this._multiplierIndex < 0) return 1;
    return SCORE.COMBO_MULTIPLIERS[this._multiplierIndex];
  }
  get comboTimerFraction() {
    if (this._comboCount === 0) return 0;
    return clamp(this._comboTimer / SCORE.COMBO_RESET_TIME, 0, 1);
  }
}
