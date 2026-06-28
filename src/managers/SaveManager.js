// =============================================================
// SaveManager.js — Persistent save data via localStorage
// =============================================================

import { CONFIG } from '../config.js';

const SCHEMA_VERSION = CONFIG.STORAGE.VERSION;
const STORAGE_KEY = CONFIG.STORAGE.KEY;

const DEFAULT_SAVE = {
  version: SCHEMA_VERSION,
  hasSeenTutorial: false,
  highScore: 0,
  totalCoins: 0,
  totalRuns: 0,
  totalDistance: 0,
  longestCombo: 0,
  bestDistance: 0,
  settings: {
    musicVolume: 0.45,
    sfxVolume: 0.7,
    muted: false,
    reducedMotion: false,
    haptics: true,
  },
  achievements: {},
  unlockedSkins: ['default'],
  activeSkin: 'default',
  dailyReward: {
    lastClaimed: null,
    streak: 0,
  },
  stats: {
    runsPerDay: {},
    coinsPerRun: [],
    bestComboRun: 0,
  },
  cheats: {
    sara: false,
    senthil: false,
    stranger: false,
  },
  unlockedCheats: [],
};

export class SaveManager {
  constructor() {
    this._data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      // Migrate if version mismatch
      if (parsed.version !== SCHEMA_VERSION) {
        return this._migrate(parsed);
      }
      // Merge with defaults to handle any new keys
      return this._deepMerge(structuredClone(DEFAULT_SAVE), parsed);
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  _migrate(old) {
    // Merge old data onto fresh defaults — handles schema upgrades
    const fresh = structuredClone(DEFAULT_SAVE);
    return this._deepMerge(fresh, { ...old, version: SCHEMA_VERSION });
  }

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('SaveManager: Failed to save', e);
    }
  }

  // ── Getters ────────────────────────────────────────────
  get(key) {
    if (key === 'totalCoins' && this.getCheat('sara')) {
      return 999999999;
    }
    return this._data[key];
  }
  getSetting(key) { return this._data.settings[key]; }
  getAchievement(id) { return this._data.achievements[id] || false; }
  get highScore() { return this._data.highScore; }
  get totalCoins() {
    if (this.getCheat('sara')) return 999999999;
    return this._data.totalCoins;
  }
  get settings() { return this._data.settings; }

  // ── Cheats ─────────────────────────────────────────────
  isCheatUnlocked(key) {
    if (!this._data.unlockedCheats) this._data.unlockedCheats = [];
    return this._data.unlockedCheats.includes(key);
  }

  unlockCheat(key) {
    if (!this._data.unlockedCheats) this._data.unlockedCheats = [];
    if (!this._data.unlockedCheats.includes(key)) {
      this._data.unlockedCheats.push(key);
      this.save();
    }
  }

  getCheat(key) {
    return this._data.cheats && this._data.cheats[key];
  }

  setCheat(key, active) {
    if (!this._data.cheats) this._data.cheats = {};
    this._data.cheats[key] = active;
    this.save();
  }

  // ── Setters ────────────────────────────────────────────
  setSetting(key, value) {
    this._data.settings[key] = value;
    this.save();
  }

  setHasSeenTutorial(val) {
    this._data.hasSeenTutorial = val;
    this.save();
  }

  updateHighScore(score) {
    if (score > this._data.highScore) {
      this._data.highScore = score;
      this.save();
      return true; // new high score
    }
    return false;
  }

  addCoins(amount) {
    this._data.totalCoins += amount;
    this.save();
  }

  recordRun({ score, coins, distance, combo }) {
    this._data.totalRuns++;
    this._data.totalCoins += (coins * CONFIG.SCORE.COIN_VALUE);
    this._data.totalDistance += distance;
    if (distance > this._data.bestDistance) this._data.bestDistance = distance;
    if (combo > this._data.longestCombo) this._data.longestCombo = combo;
    const today = new Date().toISOString().slice(0, 10);
    this._data.stats.runsPerDay[today] = (this._data.stats.runsPerDay[today] || 0) + 1;
    this.updateHighScore(score);
    this.save();
  }

  unlockAchievement(id) {
    if (!this._data.achievements[id]) {
      this._data.achievements[id] = Date.now();
      this.save();
      return true;
    }
    return false;
  }

  claimDailyReward() {
    const today = new Date().toISOString().slice(0, 10);
    if (this._data.dailyReward.lastClaimed === today) return false;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (this._data.dailyReward.lastClaimed === yesterday) {
      this._data.dailyReward.streak++;
    } else {
      this._data.dailyReward.streak = 1;
    }
    this._data.dailyReward.lastClaimed = today;
    this.save();
    return this._data.dailyReward.streak;
  }

  spendCoins(amount) {
    if (this.getCheat('sara')) return true;
    if (this._data.totalCoins >= amount) {
      this._data.totalCoins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  unlockSkin(id) {
    if (!this._data.unlockedSkins.includes(id)) {
      this._data.unlockedSkins.push(id);
      this.save();
    }
  }

  setActiveSkin(id) {
    if (this._data.unlockedSkins.includes(id)) {
      this._data.activeSkin = id;
      this.save();
    }
  }
}
