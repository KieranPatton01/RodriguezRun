// =============================================================
// WorldManager.js — Parallax backgrounds, day/night, weather, 3D Grid
// Manages all environmental rendering layers
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { pick, randomRange } from '../utils/MathUtils.js';
import { bus } from '../utils/EventBus.js';
import { Projection } from '../utils/Projection.js';

const DAY_SKIES = {
  dawn:  { top: 0x2c3e50, bottom: 0xe67e22, groundTint: 0xf1c40f },
  day:   { top: 0x2980b9, bottom: 0x87ceeb, groundTint: 0xcda077 },
  dusk:  { top: 0x8e44ad, bottom: 0xe74c3c, groundTint: 0xd35400 },
  night: { top: 0x2c3e50, bottom: 0x34495e, groundTint: 0x7f8c8d },
};

export class WorldManager {
  constructor(scene) {
    this._scene = scene;
    this._elapsed = 0;
    this._weather = 'clear';
    this._weatherTimer = 0;
    this._phase = 'day';
    this._phaseT = 0;

    // To allow responsive resizing, we create graphics that clear/redraw every frame
    this._skyGfx = scene.add.graphics().setDepth(-20);
    this._starsGfx = scene.add.graphics().setDepth(-19);
    this._groundGfx = scene.add.graphics().setDepth(-5);
    this._gridZOffset = 0; // For moving the road lines

    this._bgProps = [];
    this._rainEmitter = null;
    this._fogOverlay = null;

    // Initial prop spawn
    for (let i = 0; i < 8; i++) {
      this._spawnBgProp(CONFIG.WORLD.SPAWN_Z * Math.random());
    }
  }

  _spawnBgProp(z) {
    const types = ['street_lamp', 'palm_tree', 'banner', 'spanish_building', 'madrid_landmark'];
    const type = pick(types);
    // Alternate sides
    const worldX = Math.random() > 0.5 ? 300 : -300;
    const prop = this._drawBgProp(type);
    prop.worldX = worldX + randomRange(-50, 50);
    prop.z = z;
    this._bgProps.push(prop);
  }

  _drawBgProp(type) {
    const g = this._scene.add.graphics().setDepth(-2);
    switch (type) {
      case 'street_lamp':
        // Classic cast iron Spanish street lamp
        g.fillStyle(0x2c3e50, 1);
        g.fillRect(-4, -120, 8, 120); // pole
        g.fillRoundedRect(-15, -130, 30, 10, 4); // lamp base
        g.fillStyle(0xf1c40f, 0.9); // golden light
        g.fillCircle(0, -145, 12);
        g.fillStyle(0xf1c40f, 0.3); // glow
        g.fillCircle(0, -145, 40);
        g.fillStyle(0x2c3e50, 1);
        g.fillTriangle(0, -165, -10, -155, 10, -155); // roof
        break;
      case 'palm_tree':
        // Trunk
        g.fillStyle(0x8b5a2b, 1);
        g.fillRect(-6, -100, 12, 100);
        // Fronds
        g.fillStyle(0x27ae60, 1);
        g.beginPath();
        g.moveTo(0, -100); g.lineTo(-40, -80); g.lineTo(-20, -110);
        g.moveTo(0, -100); g.lineTo(40, -80); g.lineTo(20, -110);
        g.moveTo(0, -100); g.lineTo(-30, -130); g.lineTo(-10, -135);
        g.moveTo(0, -100); g.lineTo(30, -130); g.lineTo(10, -135);
        g.moveTo(0, -100); g.lineTo(0, -150); g.lineTo(-15, -120);
        g.closePath();
        g.fillPath();
        break;
      case 'banner':
        // Flag pole with Spanish flag or Madrid banner
        g.fillStyle(0xbdc3c7, 1); // silver pole
        g.fillRect(-2, -140, 4, 140);
        // Red / Yellow / Red flag
        g.fillStyle(0xc0392b, 1);
        g.fillRect(2, -130, 40, 10);
        g.fillStyle(0xf1c40f, 1);
        g.fillRect(2, -120, 40, 15);
        g.fillStyle(0xc0392b, 1);
        g.fillRect(2, -105, 40, 10);
        break;
      case 'spanish_building':
        // Traditional Spanish building
        g.fillStyle(0xfdf3e7, 1); // cream wall
        g.fillRect(-60, -200, 120, 200);
        g.fillStyle(0xd35400, 1); // terracotta roof
        g.fillTriangle(-75, -200, 75, -200, 0, -260);
        // Windows with wrought iron balconies
        for (let wy = 0; wy < 3; wy++) {
          for (let wx = 0; wx < 2; wx++) {
            g.fillStyle(0x2c3e50, 1); // dark window
            g.fillRect(-40 + wx * 55, -160 + wy * 50, 25, 35);
            g.fillStyle(0x000000, 1); // iron balcony
            g.fillRect(-45 + wx * 55, -135 + wy * 50, 35, 10);
          }
        }
        break;
      case 'madrid_landmark':
        // White stone building with dark slate dome (Metropolis style)
        g.fillStyle(0xecf0f1, 1);
        g.fillRect(-70, -280, 140, 280);
        g.fillStyle(0x34495e, 1); // dome
        g.beginPath();
        g.arc(0, -280, 70, Math.PI, Math.PI * 2);
        g.fillPath();
        g.fillStyle(0xf1c40f, 1); // gold statue top
        g.fillRect(-5, -370, 10, 20);
        g.fillCircle(0, -375, 8);
        // Columns
        g.fillStyle(0xbdc3c7, 1);
        for (let i = 0; i < 5; i++) {
          g.fillRect(-55 + i * 27, -270, 10, 270);
        }
        break;
    }
    return g;
  }

  update(delta, worldSpeed) {
    this._elapsed += delta / 1000;
    const { width: screenW, height: screenH } = this._scene.sys.game.canvas;
    
    this._updateDayNight(delta, screenW, screenH);
    this._updateWeather(delta, screenW, screenH);
    
    // Move road grid
    this._gridZOffset -= worldSpeed * (delta / 1000);
    if (this._gridZOffset <= -200) this._gridZOffset += 200; // grid spacing

    this._drawRoad(screenW, screenH);
    this._scrollProps(delta, worldSpeed, screenW, screenH);
  }

  _updateDayNight(delta, screenW, screenH) {
    const cycle = CONFIG.DAYCYCLE.DURATION;
    const t = (this._elapsed % cycle) / cycle; // 0-1
    const phases = CONFIG.DAYCYCLE.PHASES;
    const phaseIdx = Math.floor(t * phases.length);
    const phase = phases[phaseIdx % phases.length];
    const nextPhase = phases[(phaseIdx + 1) % phases.length];
    const phaseT = (t * phases.length) % 1;

    const cur = DAY_SKIES[phase];
    const nxt = DAY_SKIES[nextPhase];

    const lerpColor = (a, b, t) => Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(a),
      Phaser.Display.Color.IntegerToColor(b),
      100, Math.floor(t * 100)
    );

    const skyTopC = lerpColor(cur.top, nxt.top, phaseT);
    const skyBotC = lerpColor(cur.bottom, nxt.bottom, phaseT);

    this._skyGfx.clear();
    const horizonY = Projection.getHorizonY(screenW, screenH);
    
    // Top half sky
    this._skyGfx.fillGradientStyle(
      Phaser.Display.Color.GetColor(skyTopC.r, skyTopC.g, skyTopC.b),
      Phaser.Display.Color.GetColor(skyTopC.r, skyTopC.g, skyTopC.b),
      Phaser.Display.Color.GetColor(skyBotC.r, skyBotC.g, skyBotC.b),
      Phaser.Display.Color.GetColor(skyBotC.r, skyBotC.g, skyBotC.b),
      1
    );
    this._skyGfx.fillRect(0, 0, screenW, horizonY);

    // Stars
    this._starsGfx.clear();
    const starAlpha = phase === 'night' ? Math.min(phaseT * 2, 1) :
                      (phase === 'dusk' ? phaseT * 0.5 : 0);
    
    if (starAlpha > 0) {
      // Recreate pseudorandom stars based on screen size (fixed seed so they don't jump)
      let rng = 12345;
      const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return Math.abs(rng) / 0xffffffff; };
      
      this._starsGfx.fillStyle(0xffffff, starAlpha);
      for (let i = 0; i < 150; i++) {
        const x = rand() * screenW;
        const y = rand() * horizonY;
        const r = rand() * 1.5 + 0.5;
        if (rand() > 0.1) this._starsGfx.fillCircle(x, y, r);
      }
    }
  }

  _drawRoad(screenW, screenH) {
    const g = this._groundGfx;
    g.clear();
    const horizonY = Projection.getHorizonY(screenW, screenH);

    // Ground fill (Out of bounds area)
    g.fillStyle(CONFIG.COLORS.GROUND, 1); // Playable area retains the defined ground color
    g.fillRect(0, horizonY, screenW, screenH - horizonY);

    // Playable road fill (central 3 lanes)
    // Use a far-below-camera near edge so the road covers behind the player fully
    const roadLeftNear = Projection.project(-210, 0, -600, screenW, screenH);
    const roadRightNear = Projection.project(210, 0, -600, screenW, screenH);
    const roadLeftFar = Projection.project(-210, 0, CONFIG.WORLD.SPAWN_Z, screenW, screenH);
    const roadRightFar = Projection.project(210, 0, CONFIG.WORLD.SPAWN_Z, screenW, screenH);
    
    g.fillStyle(0x7f8c8d, 1); // Dark concrete color for buildings area
    g.beginPath();
    g.moveTo(roadLeftNear.x, roadLeftNear.y);
    g.lineTo(roadRightNear.x, roadRightNear.y);
    g.lineTo(roadRightFar.x, roadRightFar.y);
    g.lineTo(roadLeftFar.x, roadLeftFar.y);
    g.closePath();
    g.fillPath();

    // Fill below the near edge to screen bottom (covers gap under player)
    g.fillStyle(0x7f8c8d, 1);
    g.fillRect(0, roadLeftNear.y, screenW, screenH - roadLeftNear.y);

    // Grid lines
    g.lineStyle(2, CONFIG.COLORS.GROUND_LINE, 0.4);

    // Draw horizontal depth lines
    for (let z = 0; z < CONFIG.WORLD.SPAWN_Z; z += 200) {
      const actualZ = z + this._gridZOffset;
      if (actualZ <= 0) continue;
      const proj = Projection.project(0, 0, actualZ, screenW, screenH);
      g.beginPath();
      g.moveTo(0, proj.y);
      g.lineTo(screenW, proj.y);
      g.strokePath();
    }

    // Draw vertical lane lines projecting to vanishing point
    g.lineStyle(2, CONFIG.COLORS.GROUND_LINE, 0.8);
    const innerLanes = [-70, 70]; // inner lane separators
    innerLanes.forEach(wx => {
      const near = Projection.project(wx, 0, -200, screenW, screenH);
      const far = Projection.project(wx, 0, CONFIG.WORLD.SPAWN_Z, screenW, screenH);
      g.beginPath();
      g.moveTo(near.x, near.y);
      g.lineTo(far.x, far.y);
      g.strokePath();
    });

    // Draw solid curbs for the outer bounds
    g.lineStyle(4, 0xecf0f1, 1); // White solid line for curb
    const outerLanes = [-210, 210];
    outerLanes.forEach(wx => {
      const near = Projection.project(wx, 0, -200, screenW, screenH);
      const far = Projection.project(wx, 0, CONFIG.WORLD.SPAWN_Z, screenW, screenH);
      g.beginPath();
      g.moveTo(near.x, near.y);
      g.lineTo(far.x, far.y);
      g.strokePath();
    });
  }

  _scrollProps(delta, worldSpeed, screenW, screenH) {
    const dz = worldSpeed * delta / 1000;
    for (let i = this._bgProps.length - 1; i >= 0; i--) {
      const p = this._bgProps[i];
      p.z -= dz;
      
      if (p.z < CONFIG.WORLD.DESPAWN_Z) {
        p.destroy();
        this._bgProps.splice(i, 1);
        this._spawnBgProp(CONFIG.WORLD.SPAWN_Z);
      } else {
        const proj = Projection.project(p.worldX, 0, p.z, screenW, screenH);
        p.x = proj.x;
        p.y = proj.y;
        p.setScale(proj.scale);
        p.setDepth(10000 - p.z);
      }
    }
  }

  _updateWeather(delta, screenW, screenH) {
    this._weatherTimer -= delta / 1000;
    if (this._weatherTimer <= 0) {
      this._weatherTimer = CONFIG.WEATHER.CHANGE_INTERVAL + randomRange(-10, 10);
      this._setWeather(pick(CONFIG.WEATHER.TYPES), screenW, screenH);
    }
  }

  _setWeather(type, screenW, screenH) {
    if (type === this._weather) return;
    this._weather = type;

    if (this._rainEmitter) { this._rainEmitter.destroy(); this._rainEmitter = null; }
    if (this._fogOverlay)  { this._fogOverlay.destroy(); this._fogOverlay = null; }

    if (type === 'rain') {
      this._rainEmitter = this._scene.add.particles(
        screenW / 2, -20, 'particle_square', {
          speedX: { min: -20, max: 20 },
          speedY: { min: 600, max: 900 },
          scaleX: 0.05, scaleY: { start: 1.5, end: 0.5 },
          alpha: { start: 0.5, end: 0.1 },
          tint: 0xaaccee,
          lifespan: 1200,
          frequency: 15,
          quantity: 4,
          emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-screenW / 2, 0, screenW * 2, 1) },
        }
      ).setDepth(30000);
    } else if (type === 'fog') {
      this._fogOverlay = this._scene.add.rectangle(
        0, 0,
        4000, 4000,
        0x99bbcc, 0.18
      ).setDepth(29000);
    }
    bus.emit('world:weatherChange', { type });
  }

  get weather() { return this._weather; }

  destroy() {
    if (this._rainEmitter) this._rainEmitter.destroy();
    if (this._fogOverlay) this._fogOverlay.destroy();
  }
}
