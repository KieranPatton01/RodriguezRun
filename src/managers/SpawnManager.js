// =============================================================
// SpawnManager.js — Chunk-based procedural generation
// Manages object pooling and chunk scheduling
// =============================================================

import Phaser from 'phaser';
import { CONFIG, OBSTACLE_TYPES, POWERUP_TYPES } from '../config.js';
import { pickChunk } from '../utils/ChunkTemplates.js';
import { pick, randomRange } from '../utils/MathUtils.js';
import { bus } from '../utils/EventBus.js';

export class SpawnManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {DifficultyManager} difficulty
   * @param {Object} pools  - { coins, obstacles, powerups, gems }
   */
  constructor(scene, difficulty, pools) {
    this._scene = scene;
    this._diff = difficulty;
    this._pools = pools;

    this._chunkZ = CONFIG.WORLD.SPAWN_Z; // next chunk spawn Z
    this._chunkQueue = [];
    this._active = [];  // all spawned objects currently alive

    // Schedule first chunks
    this._enqueueChunks(3);
  }

  /** Call every frame with worldSpeed (units/s) and delta (ms) */
  update(delta, worldSpeed) {
    const dz = worldSpeed * (delta / 1000);
    this._chunkZ -= dz;

    // Move all active objects
    for (let i = this._active.length - 1; i >= 0; i--) {
      const obj = this._active[i];
      if (!obj.active) { this._active.splice(i, 1); continue; }

      obj.z -= dz;

      // Oscillating drones / moving hazards
      if (obj.moveData) {
        obj.moveData.phase += obj.moveData.speed * (delta / 1000);
        obj.worldY = obj.moveData.baseY + Math.sin(obj.moveData.phase) * obj.moveData.amplitude;
      }

      // Despawn based on back edge of object
      const depth = obj.typeDef?.d || 0;
      if (obj.z + depth < CONFIG.WORLD.DESPAWN_Z) {
        this._despawn(obj);
        this._active.splice(i, 1);
        continue;
      }

      if (typeof obj.updatePosition === 'function') {
        const screenW = this._scene.sys.game.canvas.width;
        const screenH = this._scene.sys.game.canvas.height;
        obj.updatePosition(screenW, screenH);
      }
    }

    // Check if we need to spawn new chunks
    if (this._chunkZ < CONFIG.WORLD.SPAWN_Z) {
      this._spawnNextChunk();
    }
  }

  _enqueueChunks(count) {
    for (let i = 0; i < count; i++) {
      this._chunkQueue.push(pickChunk(this._diff.tier));
    }
  }

  _spawnNextChunk() {
    if (this._chunkQueue.length === 0) this._enqueueChunks(2);
    const chunk = this._chunkQueue.shift();
    this._spawnChunk(chunk, this._chunkZ);
    const chunkLength = CONFIG.WORLD.CHUNK_LENGTH / this._diff.density;
    this._chunkZ += chunkLength;
    // Pre-queue next chunk
    this._chunkQueue.push(pickChunk(this._diff.tier));
  }

  _spawnChunk(chunk, startZ) {
    for (const obj of chunk.objects) {
      // In chunk templates, "x" historically meant offset. We treat it as Z offset now.
      const scaledOffset = (obj.x || 0) / this._diff.density;
      const z = startZ + scaledOffset;
      const lane = obj.lane ?? 1;
      const worldX = CONFIG.LANES.POSITIONS[lane];

      switch (obj.type) {
        case 'obstacle': this._spawnObstacle(obj, z, worldX); break;
        case 'coin':     
          this._spawnCoin(z, worldX, obj.y || 0); 
          // Extra euros for higher tiers
          if (this._diff.tier >= 3 && Math.random() < 0.4) {
            this._spawnCoin(z, CONFIG.LANES.POSITIONS[(lane + 1) % 3], obj.y || 0);
          }
          if (this._diff.tier >= 4 && Math.random() < 0.4) {
            this._spawnCoin(z, CONFIG.LANES.POSITIONS[(lane + 2) % 3], obj.y || 0);
          }
          break;
        case 'powerup':  this._spawnPowerup(obj, z, worldX); break;
        case 'gem':      this._spawnGem(z, worldX); break;
      }
    }
  }

  _spawnObstacle(def, z, worldX) {
    const lookupKey = def.key.toUpperCase().replace('-', '_');
    const typeDef = OBSTACLE_TYPES[lookupKey] || OBSTACLE_TYPES.TERRACE; // safe fallback
    if (!typeDef) return; // should never happen but prevents crashes
    const obj = this._pools.obstacles.acquire();
    obj.activate(worldX, CONFIG.PLAYER.GROUND_Y, z, def.key, typeDef, def.lane ?? 1);

    if (def.moving) {
      obj.moveData = {
        baseY: obj.worldY,
        amplitude: def.amplitude || 0,
        speed: def.speed || 1,
        phase: 0,
      };
    } else {
      obj.moveData = null;
    }
    this._active.push(obj);
  }

  _spawnCoin(z, worldX, yOffset) {
    const obj = this._pools.coins.acquire();
    obj.activate(worldX, CONFIG.PLAYER.GROUND_Y + 50 + yOffset, z);
    this._active.push(obj);
  }

  _spawnPowerup(def, z, worldX) {
    const obj = this._pools.powerups.acquire();
    const typeKey = def.key === 'random'
      ? pick(Object.keys(POWERUP_TYPES))
      : def.key.toUpperCase();
    obj.activate(worldX, CONFIG.PLAYER.GROUND_Y + 80, z, POWERUP_TYPES[typeKey] || POWERUP_TYPES.MAGNET);
    this._active.push(obj);
  }

  _spawnGem(z, worldX) {
    const obj = this._pools.gems.acquire();
    obj.activate(worldX, CONFIG.PLAYER.GROUND_Y + 60, z);
    this._active.push(obj);
  }

  _despawn(obj) {
    if (obj._poolType === 'obstacle') this._pools.obstacles.release(obj);
    else if (obj._poolType === 'coin') this._pools.coins.release(obj);
    else if (obj._poolType === 'powerup') this._pools.powerups.release(obj);
    else if (obj._poolType === 'gem') this._pools.gems.release(obj);
    obj.deactivate?.();
  }

  /** Collect specific object (called from collision handler) */
  collect(obj) {
    const idx = this._active.indexOf(obj);
    if (idx >= 0) this._active.splice(idx, 1);
    this._despawn(obj);
  }

  reset() {
    for (const obj of this._active) {
      this._despawn(obj);
    }
    this._active = [];
    this._chunkZ = CONFIG.WORLD.SPAWN_Z;
    this._chunkQueue = [];
    this._enqueueChunks(3);
  }

  get activeObjects() { return this._active; }
}
