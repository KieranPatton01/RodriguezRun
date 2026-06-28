// =============================================================
// GameScene.js — Core gameplay scene
// Integrates all managers, entities, and game loop logic
// =============================================================

import Phaser from 'phaser';
import { CONFIG, OBSTACLE_TYPES, POWERUP_TYPES } from '../config.js';
import { Player } from '../entities/Player.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { PowerUp } from '../entities/PowerUp.js';
import { Gem } from '../entities/Gem.js';
import { SpawnManager } from '../managers/SpawnManager.js';
import { ScoreManager } from '../managers/ScoreManager.js';
import { DifficultyManager } from '../managers/DifficultyManager.js';
import { WorldManager } from '../managers/WorldManager.js';
import { CameraManager } from '../managers/CameraManager.js';
import { ParticleManager } from '../managers/ParticleManager.js';
import { InputManager } from '../managers/InputManager.js';
import { SaveManager } from '../managers/SaveManager.js';
import { HUD } from '../ui/HUD.js';
import { FloatingTextManager } from '../ui/FloatingText.js';
import { AchievementPopup } from '../ui/AchievementPopup.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { bus } from '../utils/EventBus.js';
import { getAudioContext } from '../utils/AudioSynth.js';
import { Transitions } from '../ui/Transitions.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this._save = this.game.registry.get('saveManager') || new SaveManager();
    this.game.registry.set('saveManager', this._save);
  }

  create() {
    bus.clear();

    const { WIDTH, HEIGHT } = CONFIG;

    // ── Managers ──────────────────────────────────────────────
    this._difficulty = new DifficultyManager();
    this._score      = new ScoreManager();
    this._camera     = new CameraManager(this);
    this._particles  = new ParticleManager(this);
    this._achieved   = {};

    // ── Object Pools ─────────────────────────────────────────
    this._pools = {
      obstacles: new ObjectPool(
        () => new Obstacle(this),
        (o) => o.deactivate?.(),
        8
      ),
      coins: new ObjectPool(
        () => new Coin(this),
        (c) => c.deactivate?.(),
        20
      ),
      powerups: new ObjectPool(
        () => new PowerUp(this),
        (p) => p.deactivate?.(),
        4
      ),
      gems: new ObjectPool(
        () => new Gem(this),
        (g) => g.deactivate?.(),
        4
      ),
    };

    // ── World ─────────────────────────────────────────────────
    this._world = new WorldManager(this);

    // ── Player ───────────────────────────────────────────────
    this._player = new Player(this);

    // ── Spawn system ─────────────────────────────────────────
    this._spawn = new SpawnManager(this, this._difficulty, this._pools);

    // ── Input ─────────────────────────────────────────────────
    this._input = new InputManager(this);

    // ── UI ───────────────────────────────────────────────────
    this._hud = new HUD(this);
    this._floatingText = new FloatingTextManager(this);
    this._achievements = new AchievementPopup(this);

    // ── Powerup state ─────────────────────────────────────────
    this._activePowerups = {};
    this._magnetActive = false;
    this._hoverboardActive = false;
    this._hitCount = 0;

    // ── Run state ─────────────────────────────────────────────
    this._running = true;
    this._paused  = false;
    this._runStart = this._save.get('totalRuns');

    // ── Particle trail ────────────────────────────────────────
    this._particles.createTrail(this._player._container);

    // ── Events ────────────────────────────────────────────────
    this._setupEvents();

    // ── Pause overlay (built but hidden) ─────────────────────
    this._buildPauseOverlay();

    // Camera fade in
    Transitions.fadeIn(this, 600);

    // Record run start
    this._save.recordRun({ score: 0, coins: 0, distance: 0, combo: 0 });
    bus.emit('achievement:unlock', { id: 'first_run' });

    // SFX listener
    bus.on('sfx:play', ({ key }) => this._playSound(key));

    // Apply B&W if senthil cheat active
    if (this._save.getCheat('senthil')) {
      this.sys.game.canvas.style.filter = 'grayscale(100%)';
      this._senthilActive = true;
    } else {
      this.sys.game.canvas.style.filter = '';
      this._senthilActive = false;
    }
  }

  _setupEvents() {
    // Pause
    bus.on('input:pause', () => this._togglePause());

    // Player death → game over
    bus.on('player:death', () => {
      this.time.delayedCall(800, () => this._triggerGameOver());
    });

    // Powerup activation
    bus.on('powerup:collected', ({ type }) => this._activatePowerup(type));

    // Combo events → achievements
    bus.on('score:comboUp', ({ multiplier, index }) => {
      if (index === 0) bus.emit('achievement:unlock', { id: 'combo_10' });
      if (index === 1) bus.emit('achievement:unlock', { id: 'combo_30' });
      this._floatingText.showCombo(
        this._player.x, this._player.y - 40,
        `x${multiplier} COMBO!`
      );
    });

    // Score milestones
    bus.on('score:update', ({ score }) => {
      if (score > 1000) bus.emit('achievement:unlock', { id: 'score_1000' });
      if (score > 10000) bus.emit('achievement:unlock', { id: 'score_10000' });
    });

    // Powerup shield consumed → achievement
    bus.on('powerup:shieldConsumed', () => {
      bus.emit('achievement:unlock', { id: 'shield_save' });
    });
  }

  _buildPauseOverlay() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;

    this._pauseOverlay = this.add.container(WIDTH / 2, HEIGHT / 2).setDepth(80).setVisible(false);

    const dim = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.7);
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1b2a, 0.95);
    panel.fillRoundedRect(-130, -140, 260, 280, 14);
    panel.lineStyle(2, C.NEON_CYAN, 0.8);
    panel.strokeRoundedRect(-130, -140, 260, 280, 14);

    const title = this.add.text(0, -105, '⏸ PAUSED', {
      font: 'bold 20px "Orbitron", monospace', fill: '#00d4ff',
    }).setOrigin(0.5);

    const resumeBtn = this.add.text(0, -40, '▶ RESUME', {
      font: 'bold 14px "Orbitron", monospace',
      fill: '#0d1b2a', backgroundColor: '#00d4ff',
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerup', () => this._togglePause());

    const restartBtn = this.add.text(0, 30, '↺ RESTART', {
      font: 'bold 14px "Orbitron", monospace',
      fill: '#ffffff', backgroundColor: '#223344',
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerup', () => {
      this._paused = false;
      this.physics.resume();
      Transitions.fadeOut(this, 'GameScene', {}, 300);
    });

    const menuBtn = this.add.text(0, 100, '⌂ MENU', {
      font: '13px "Orbitron", monospace', fill: '#ffffff88',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerup', () => Transitions.fadeOut(this, 'MenuScene', {}, 300));

    this._pauseOverlay.add([dim, panel, title, resumeBtn, restartBtn, menuBtn]);
  }

  _togglePause() {
    this._paused = !this._paused;
    this._pauseOverlay.setVisible(this._paused);
    if (this._paused) {
      this.physics.pause();
      this._input.disable();
    } else {
      this.physics.resume();
      this._input.enable();
    }
  }

  update(time, delta) {
    if (!this._running || this._paused || !this._player.alive) return;

    const speed = this._difficulty.speed;

    // Update systems
    this._difficulty.update(delta);
    this._score.update(delta, speed);
    this._world.update(delta, speed);
    this._player.update(delta);
    this._spawn.update(delta, speed);
    this._camera.update(delta);
    this._hud.update(this._score);

    // Update individual pooled objects
    this._updateCoins(delta, speed);
    this._updatePowerups(delta, speed);
    this._updateGems(delta, speed);

    // Collision detection
    this._checkCollisions();

    // Distance achievements
    const dist = this._score.distance;
    if (dist > 500 && !this._achieved.d500) { this._achieved.d500 = true; bus.emit('achievement:unlock', { id: 'distance_500' }); }
    if (dist > 2000 && !this._achieved.d2000) { this._achieved.d2000 = true; bus.emit('achievement:unlock', { id: 'distance_2000' }); }

    // Difficulty tier change → speed lines
    this._updateSpeedLines(speed);
  }

  _updateCoins(delta, speed) {
    this._pools.coins.active.forEach(coin => {
      if (!coin.active) return;
      coin.update(delta, speed, this._player.worldX, this._player.worldY, this._player.z, this._magnetActive);
    });
  }

  _updatePowerups(delta, speed) {
    this._pools.powerups.active.forEach(pu => {
      if (!pu.active) return;
      pu.update(delta, speed);
    });
  }

  _updateGems(delta, speed) {
    this._pools.gems.active.forEach(gem => {
      if (!gem.active) return;
      gem.update(delta, speed);
    });
  }

  getFloorY(lane, z) {
    let floorY = 0;
    this._pools.obstacles.active.forEach(obs => {
      if (!obs.active) return;
      const tDef = obs.typeDef;
      // We check if the player's worldX matches the obstacle's worldX since lanes aren't stored exactly here
      const isSameLane = Math.abs(obs.worldX - CONFIG.LANES.POSITIONS[lane]) < 10;
      if (!tDef || !isSameLane) return;
      
      const depth = tDef.d || 100;
      if (z >= obs.z && z <= obs.z + depth) {
        if (tDef.surface) {
          floorY = Math.max(floorY, tDef.h || 60);
        } else if (tDef.ramp) {
          const t = (z - obs.z) / depth;
          floorY = Math.max(floorY, t * (tDef.h || 60));
        }
      }
    });
    return floorY;
  }

  _checkCollisions() {
    const player = this._player;
    const phb = player.hitbox;
    
    // Exact Z-overlap check for obstacles with depth
    const checkObstacleZ = (obs) => {
      const depth = obs.typeDef?.d || 50;
      // Slop of 20 units added to front to ensure high-speed hits trigger
      return player.z >= obs.z - 20 && player.z <= obs.z + depth;
    };

    // Check obstacles
    if (!this._save.getCheat('stranger')) {
      this._pools.obstacles.active.forEach(obs => {
        if (!obs.active || !checkObstacleZ(obs)) return;
        
        // Ramps are always safe to run into (they push you up)
        if (obs.typeDef?.ramp) return;
        
        // For flat elevated surfaces (like tram roofs), check if player is safely on top
        const isWalkable = obs.typeDef?.surface;
        const isPlayerAbove = player.worldY >= (obs.typeDef?.h || 60) * 0.8;
        
        if (isWalkable && isPlayerAbove) return; // safe!

        if (this._rectsOverlap(phb, obs.hitbox)) {
          const died = player.hit();
          if (died) {
            this._hitCount++;
            if (this._hitCount >= 1) player.die();
          }
        }
      });
    }

    // Check coins in 3D space
    const toCollect = [];
    this._pools.coins.active.forEach(coin => {
      if (!coin.active) return;
      const dx = coin.worldX - player.worldX;
      // Note: y is negative upwards. Player jump reaches ~ -150.
      const dy = coin.worldY - player.worldY;
      const dz = coin.z - player.z;
      
      // Bounding box: 50 width, 100 height, 60 depth
      if (Math.abs(dx) < 40 && Math.abs(dz) < 60 && dy > -100 && dy < 60) {
        toCollect.push(coin);
      }
    });
    toCollect.forEach(coin => {
      bus.emit('coin:collected');
      bus.emit('particle:coinBurst', { x: coin.x, y: coin.y });
      this._floatingText.showCoin(coin.x, coin.y, this._score.multiplier);
      this._playSound('sfx_coin');
      this._spawn.collect(coin);
    });

    // Check powerups
    this._pools.powerups.active.forEach(pu => {
      if (!pu.active) return;
      const dx = pu.worldX - player.worldX;
      const dy = pu.worldY - player.worldY;
      const dz = pu.z - player.z;
      if (Math.abs(dx) < 40 && Math.abs(dz) < 60 && dy > -100 && dy < 60) {
        bus.emit('powerup:collected', { type: pu.typeData });
        this._floatingText.showPowerup(pu.x, pu.y, pu.typeData?.label || 'POWERUP!');
        this._playSound('sfx_powerup');
        this._spawn.collect(pu);
      }
    });

    // Check gems
    this._pools.gems.active.forEach(gem => {
      if (!gem.active) return;
      const dx = gem.worldX - player.worldX;
      const dy = gem.worldY - player.worldY;
      const dz = gem.z - player.z;
      if (Math.abs(dx) < 40 && Math.abs(dz) < 60 && dy > -100 && dy < 60) {
        bus.emit('gem:collected');
        bus.emit('particle:gemBurst', { x: gem.x, y: gem.y });
        this._floatingText.showGem(gem.x, gem.y);
        this._playSound('sfx_gem');
        this._spawn.collect(gem);
      }
    });
  }

  _rectsOverlap(a, b) {
    const aHalfW = (a.width * (a.scaleX || a.scale || 1)) / 2;
    const aHalfH = (a.height * (a.scaleY || a.scale || 1)) / 2;
    const bHalfW = (b.width * (b.scaleX || b.scale || 1)) / 2;
    const bHalfH = (b.height * (b.scaleY || b.scale || 1)) / 2;
    return (
      Math.abs(a.x - b.x) < aHalfW + bHalfW &&
      Math.abs(a.y - b.y) < aHalfH + bHalfH
    );
  }

  _circleRect(cx, cy, cr, rect) {
    const hw = (rect.width * (rect.scaleX || rect.scale || 1)) / 2;
    const hh = (rect.height * (rect.scaleY || rect.scale || 1)) / 2;
    const closestX = Math.max(rect.x - hw, Math.min(cx, rect.x + hw));
    const closestY = Math.max(rect.y - hh, Math.min(cy, rect.y + hh));
    const dx = cx - closestX, dy = cy - closestY;
    return (dx * dx + dy * dy) < cr * cr;
  }

  _activatePowerup(typeData) {
    if (!typeData) return;
    const key = typeData.key;
    const C = CONFIG.POWERUP;

    // Clear existing timer for this powerup if already active
    if (this._activePowerups[key]) {
      clearTimeout(this._activePowerups[key]);
    }

    // Apply effect
    let duration = 0;
    switch (key) {
      case 'pu_magnet':
        this._magnetActive = true;
        duration = C.MAGNET;
        break;
      case 'pu_double':
        this._score.setDoubleScore(true);
        duration = C.DOUBLE_SCORE;
        break;
      case 'pu_shield':
        this._player.activateShield();
        duration = 0; // Lasts until hit
        break;
      case 'pu_slow':
        this._difficulty._speed *= C.SLOW_FACTOR;
        duration = C.SLOW_MOTION;
        break;
      case 'pu_speed':
        this._difficulty._speed *= C.SPEED_FACTOR;
        duration = C.SPEED_BOOST;
        bus.emit('particle:speedLines', { active: true });
        break;
      case 'pu_hoverboard':
        this._hoverboardDeactivate = this._player.activateHoverboard();
        this._player._invincibleTimer = C.HOVERBOARD;
        duration = C.HOVERBOARD;
        break;
    }

    bus.emit('powerup:start', { key, duration });

    if (duration > 0) {
      this._activePowerups[key] = setTimeout(() => {
        this._deactivatePowerup(key);
      }, duration);
    }
  }

  _deactivatePowerup(key) {
    delete this._activePowerups[key];
    switch (key) {
      case 'pu_magnet':  this._magnetActive = false; break;
      case 'pu_double':  this._score.setDoubleScore(false); break;
      case 'pu_slow':    /* speed returns naturally */; break;
      case 'pu_speed':
        bus.emit('particle:speedLines', { active: false });
        break;
      case 'pu_hoverboard':
        if (this._hoverboardDeactivate) this._hoverboardDeactivate();
        break;
    }
    bus.emit('powerup:end', { key });
  }

  _updateSpeedLines(speed) {
    // Speed lines at top difficulty levels
    if (speed > 600 && !this._speedLinesActive) {
      this._speedLinesActive = true;
      bus.emit('particle:speedLines', { active: true });
    } else if (speed <= 600 && this._speedLinesActive && !this._activePowerups['pu_speed']) {
      this._speedLinesActive = false;
      bus.emit('particle:speedLines', { active: false });
    }
  }

  _triggerGameOver() {
    this._running = false;
    this._input.disable();

    // Save run stats
    this._save.recordRun({
      score: this._score.score,
      coins: this._score.coins,
      distance: this._score.distance,
      combo: this._score.peakCombo,
    });

    const isNewHighScore = this._save.updateHighScore(this._score.score);

    // Small delay then transition
    this.time.delayedCall(600, () => {
      Transitions.fadeOut(this, 'GameOverScene', {
        score: this._score.score,
        coins: this._score.coins,
        distance: this._score.distance,
        combo: this._score.peakCombo,
        isNewHighScore,
        highScore: this._save.highScore,
      }, 400);
    });
  }

  _playSound(key) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const save = this._save;
      const muted = save.getSetting('muted');
      const vol = save.getSetting('sfxVolume') ?? 0.7;

      const tones = {
        sfx_coin:    { freq: 880, vol: 0.06, dur: 0.12, type: 'sine' },
        sfx_gem:     { freq: [880, 1100, 1320], vol: 0.08, dur: 0.2, type: 'sine' },
        sfx_jump:    { freq: 550, vol: 0.1,  dur: 0.12, type: 'sine' },
        sfx_slide:   { freq: 220, vol: 0.07, dur: 0.15, type: 'sawtooth' },
        sfx_hit:     { freq: 110, vol: 0.15, dur: 0.2,  type: 'square' },
        sfx_powerup: { freq: [440, 660, 880], vol: 0.1, dur: 0.25, type: 'sine' },
        sfx_shield:  { freq: [660, 440], vol: 0.1, dur: 0.2, type: 'sine' },
        sfx_death:   { freq: 55, vol: 0.2, dur: 0.6, type: 'sawtooth' },
        sfx_lane:    { freq: 440, vol: 0.04, dur: 0.05, type: 'sine' },
      };

      const tone = tones[key];
      if (!tone || muted) { ctx.close(); return; }

      gain.gain.value = tone.vol * vol;

      if (Array.isArray(tone.freq)) {
        tone.freq.forEach((f, i) => {
          const o2 = ctx.createOscillator();
          o2.connect(gain);
          o2.frequency.value = f;
          o2.type = tone.type;
          o2.start(ctx.currentTime + i * 0.06);
          o2.stop(ctx.currentTime + i * 0.06 + tone.dur);
        });
      } else {
        osc.frequency.value = tone.freq;
        osc.type = tone.type;
        osc.start(ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + tone.dur);
        osc.stop(ctx.currentTime + tone.dur);
      }
    } catch (e) { /* silently fail */ }
  }

  shutdown() {
    // Clear the B&W CSS filter if active so it doesn't bleed into other scenes
    if (this._senthilActive) {
      this.sys.game.canvas.style.filter = '';
    }
    // Clean up all active powerup timers
    Object.values(this._activePowerups).forEach(t => clearTimeout(t));
    this._pools?.obstacles.releaseAll();
    this._pools?.coins.releaseAll();
    this._pools?.powerups.releaseAll();
    this._pools?.gems.releaseAll();
    this._world?.destroy();
    this._particles?.destroyTrail();
    this._input?.destroy();
    bus.clear();
  }
}
