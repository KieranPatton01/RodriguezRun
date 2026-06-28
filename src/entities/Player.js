// =============================================================
// Player.js — The protagonist (Mira) entity
// Handles state machine, animations, lane switching, jump, slide
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { lerp, clamp } from '../utils/MathUtils.js';
import { bus } from '../utils/EventBus.js';
import { Projection } from '../utils/Projection.js';

// Player state constants
const STATE = {
  IDLE:     'idle',
  RUN:      'run',
  JUMP:     'jump',
  STUMBLE:  'stumble',
  DEATH:    'death',
};

export class Player {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this._scene = scene;
    this._state = STATE.IDLE;
    this._lane = CONFIG.PLAYER.START_LANE;
    this._worldX = CONFIG.LANES.POSITIONS[this._lane];
    this._targetWorldX = this._worldX;
    this._invincibleTimer = 0;
    this._isGrounded = true;
    this._shieldActive = false;
    this._hoverboardActive = false;
    this._alive = true;

    // Velocity for jump arc (manual, not physics)
    this._velY = 0;
    this._worldY = CONFIG.PLAYER.GROUND_Y;

    this._create();
    this._setupInput();
  }

  _create() {
    const scene = this._scene;
    const { GROUND_Y } = CONFIG.PLAYER;
    const startX = CONFIG.LANES.POSITIONS[CONFIG.PLAYER.START_LANE];

    this._container = scene.add.container(0, 0).setDepth(10000);

    // Body graphics (programmatic pixel art)
    this._bodyGfx = scene.add.graphics();
    this._drawPlayerBody(STATE.RUN);
    this._container.add(this._bodyGfx);

    // Shield bubble overlay
    this._shieldGfx = scene.add.graphics().setAlpha(0);
    this._drawShieldBubble();
    this._container.add(this._shieldGfx);

    // Hoverboard glow
    this._boardGfx = scene.add.graphics().setAlpha(0);
    this._container.add(this._boardGfx);

    // Hitbox (invisible rectangle used for overlap checks)
    this._hitbox = scene.add.rectangle(
      0, 0,
      CONFIG.PLAYER.HITBOX.run[0],
      CONFIG.PLAYER.HITBOX.run[1],
      0xff0000, 0
    ).setDepth(10000);

    // Invincibility flash tween (stored for control)
    this._flashTween = null;

    // Animation frame counter
    this._animFrame = 0;
    this._animTimer = 0;
    this._animSpeed = 80; // ms per frame

    // Start running animation
    this.setState(STATE.RUN);

    const saveManager = this._scene.game.registry.get('saveManager');
    const activeSkin = saveManager ? saveManager.get('activeSkin') : 'default';
    if (activeSkin === 'abid') {
      this._moneyEmitter = scene.add.particles(0, 0, 'particle_square', {
        follow: this._container,
        speedX: { min: -200, max: 200 },
        speedY: { min: -400, max: -100 },
        scaleX: { start: 2.5, end: 0.8 },
        scaleY: { start: 1.2, end: 0.4 },
        alpha: { start: 1, end: 0 },
        tint: 0x27ae60, // Green
        lifespan: 1200,
        frequency: 50,
        quantity: 3,
        gravityY: 250,
        rotate: { min: 0, max: 360 },
      }).setDepth(10000);
    } else if (activeSkin === 'stinky_sara') {
      this._stinkEmitter = scene.add.particles(0, 0, 'particle_square', {
        follow: this._container,
        speedX: { min: -50, max: 50 },
        speedY: { min: -100, max: -20 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: 0x2ecc71, // Neon green stink
        lifespan: 1500,
        frequency: 100,
        quantity: 1,
        blendMode: 'ADD',
      }).setDepth(10000);
    } else if (activeSkin === 'fiancee_sara') {
      this._confettiEmitter = scene.add.particles(0, -50, 'particle_square', {
        follow: this._container,
        speedX: { min: -150, max: 150 },
        speedY: { min: -200, max: 50 },
        scale: { start: 0.8, end: 0.4 },
        alpha: { start: 1, end: 0 },
        tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff],
        lifespan: 2000,
        frequency: 60,
        quantity: 2,
        gravityY: 100,
        rotate: { min: 0, max: 360 },
      }).setDepth(10000);
    }
  }

  _drawPlayerBody(state) {
    this._bodyGfx.clear();
    const saveManager = this._scene.game.registry.get('saveManager');
    const skinId = saveManager ? saveManager.get('activeSkin') : 'default';
    Player.drawSkin(this._bodyGfx, skinId, this._animFrame, state);
  }

  static drawSkin(g, skinId, animFrame, state) {
    const isDead  = state === 4; // STATE.DEATH = 4
    const isStumble = state === 3; // STATE.STUMBLE = 3

    // --- Body proportions ---
    const bodyW = 28, bodyH = 44;
    const headR = 12;
    const legH  = 22;
    const baseY = 0;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 42, 36, 10);

    const legSwing = Math.sin(animFrame * 0.8) * 8;
    const armSwing = Math.sin(animFrame * 0.8 + Math.PI) * 10;

    // Default parameters (Safestay-Sara)
    let colors = {
      skin: 0xf5c8a0,
      shirt: isStumble ? 0x922b21 : 0x111111,
      pants: 0x3498db,
      shoes: 0xffffff,
      hairBase: 0x1a1a1a,
      hairStreak: 0x5c4033,
      hat: null,
    };
    let clothing = {
      shorts: false,
      polo: false,
      shoeDetail: null,
      hairStyle: 'long',
      muddy: false,
      veil: false,
    };

    if (skinId === 'rugby_sara') {
      colors.shirt = isStumble ? 0x922b21 : 0xc0392b; // red t-shirt
      colors.pants = 0x111111; // black shorts
      colors.shoes = 0x222222; // black boots
      clothing.shorts = true;
    } else if (skinId === 'senthil') {
      colors.skin = 0x8d5524; // Indian skin tone
      colors.shirt = isStumble ? 0x922b21 : 0xecf0f1; // white shirt
      colors.pants = 0x7f8c8d; // grey trousers
      colors.shoes = 0x111111; // black shoes
      clothing.hairStyle = 'short';
    } else if (skinId === 'tj') {
      colors.skin = 0x8d5524; // Indian skin tone
      colors.shirt = isStumble ? 0x922b21 : 0x27ae60; // green polo
      colors.pants = 0x2980b9; // blue trousers
      colors.shoes = 0x641e16; // maroon
      clothing.shoeDetail = 0xffffff; // maroon and white shoes
      clothing.polo = true;
      clothing.hairStyle = 'short';
    } else if (skinId === 'stranger_sara') {
      colors.shirt = isStumble ? 0x922b21 : 0x111111; // black dress
      colors.pants = 0x111111; // black dress skirt
      colors.shoes = 0x111111; // black heels
      clothing.shorts = true; // bare lower legs
      clothing.hairStyle = 'short'; // shaved/short hair
    } else if (skinId === 'eras_tour_sara') {
      colors.shirt = isStumble ? 0x922b21 : 0xfffdd0; // cream corset
      colors.pants = 0xffffff; // white skirt
      colors.shoes = 0x8b4513; // brown cowboy boots
      clothing.shorts = true; // bare lower legs
      clothing.hairStyle = 'long';
      clothing.hat = 'cowboy';
      colors.hat = 0xffffff; // white cowboy hat
    } else if (skinId === 'sleepy_sara') {
      colors.shirt = isStumble ? 0x922b21 : 0x87ceeb; // light blue pajamas
      colors.pants = 0x87ceeb; // light blue pajamas
      colors.shoes = 0xecf0f1; // white slippers
      clothing.hairStyle = 'long';
      clothing.hat = 'sleeping';
      colors.hat = 0x87ceeb;
    } else if (skinId === 'abid') {
      colors.skin = 0xe0ac69; // skin tone
      colors.shirt = isStumble ? 0x922b21 : 0x111111; // black t-shirt
      colors.pants = 0x2980b9; // blue jeans
      colors.shoes = 0xbdc3c7; // designer shoes
      colors.hairBase = 0x111111; // short black hair
      clothing.hairStyle = 'short';
    } else if (skinId === 'stinky_sara') {
      clothing.muddy = true; // Use default colors but with mud
    } else if (skinId === 'fiancee_sara') {
      colors.shirt = isStumble ? 0x922b21 : 0xffffff; // white dress top
      colors.pants = 0xffffff; // white dress skirt
      colors.shoes = 0xffffff; // white heels
      clothing.shorts = true; // bare legs under dress
      clothing.veil = true;
    }

    if (!isDead) {
      // Legs
      if (clothing.shorts) {
        // Skin tone for lower legs
        g.fillStyle(colors.skin, 1);
        g.fillRect(-8 + legSwing, baseY + bodyH + 10, 10, legH - 8);
        g.fillRect(2 - legSwing, baseY + bodyH + 10, 10, legH - 8);
        // Shorts
        g.fillStyle(colors.pants, 1);
        g.fillRect(-8 + legSwing, baseY + bodyH, 10, 10);
        g.fillRect(2 - legSwing, baseY + bodyH, 10, 10);
      } else {
        // Trousers
        g.fillStyle(colors.pants, 1);
        g.fillRect(-8 + legSwing, baseY + bodyH, 10, legH + 2);
        g.fillRect(2 - legSwing, baseY + bodyH, 10, legH + 2);
      }

      // Shoes
      g.fillStyle(colors.shoes, 1);
      g.fillRoundedRect(-10 + legSwing, baseY + bodyH + legH, 14, 8, 3);
      g.fillRoundedRect(0 - legSwing, baseY + bodyH + legH, 14, 8, 3);
      
      if (clothing.shoeDetail !== null) {
        g.fillStyle(clothing.shoeDetail, 1);
        g.fillRect(-10 + legSwing + 4, baseY + bodyH + legH, 6, 8);
        g.fillRect(0 - legSwing + 4, baseY + bodyH + legH, 6, 8);
      }
    }

    // Torso
    g.fillStyle(colors.shirt, 1);
    g.fillRoundedRect(-bodyW / 2 + 2, baseY, bodyW - 4, bodyH, 4);
    if (clothing.polo) {
      g.fillStyle(colors.skin, 1);
      g.fillTriangle(-4, baseY, 4, baseY, 0, baseY + 8); // V-neck
      g.fillStyle(colors.shirt, 1);
      g.fillRect(-8, baseY, 16, 4); // collar
    }

    // Arms
    g.fillStyle(colors.skin, 1);
    g.fillRoundedRect(-bodyW / 2 - 6, baseY + 4 + armSwing, 8, 20, 3);
    g.fillRoundedRect(bodyW / 2 - 2, baseY + 4 - armSwing, 8, 20, 3);

    // Short sleeves for t-shirts/polos
    g.fillStyle(colors.shirt, 1);
    g.fillRoundedRect(-bodyW / 2 - 6, baseY + 4 + armSwing, 8, 8, 2);
    g.fillRoundedRect(bodyW / 2 - 2, baseY + 4 - armSwing, 8, 8, 2);

    // Head
    const headY = baseY - headR - 4;
    g.fillStyle(colors.skin, 1);
    g.fillCircle(0, headY, headR);

    // Hair
    g.fillStyle(colors.hairBase, 1);
    
    if (clothing.hairStyle === 'long') {
      g.fillEllipse(0, headY - 2, headR * 2.2, headR * 2.4);
      g.fillRoundedRect(-headR + 2, headY + 4, headR * 2 - 4, 18, 4);
      if (colors.hairStreak) {
        g.fillStyle(colors.hairStreak, 1); 
        g.fillRoundedRect(-headR + 4, headY - 2, 4, 12, 2);
      }
    } else if (clothing.hairStyle === 'short') {
      g.fillEllipse(0, headY - 4, headR * 2, headR * 1.8);
      // Short hair trim
      g.fillRoundedRect(-headR + 2, headY - headR, headR * 2 - 4, headR + 2, 2);
    }

    // Veil
    if (clothing.veil) {
      g.fillStyle(0xffffff, 0.6);
      g.fillRoundedRect(-headR - 4, headY - headR, headR * 2 + 8, bodyH + headR, 6);
      g.fillStyle(0xffffff, 0.9);
      g.fillEllipse(0, headY - headR, headR * 2, 6);
    }

    // Hat
    if (clothing.hat === 'cowboy') {
      g.fillStyle(colors.hat, 1);
      g.fillEllipse(0, headY - headR + 4, headR * 3.5, 8); // Brim
      g.fillRoundedRect(-headR + 2, headY - headR - 8, headR * 2 - 4, 14, 4); // Crown
    } else if (clothing.hat === 'sleeping') {
      g.fillStyle(colors.hat, 1);
      g.fillTriangle(-headR, headY - headR + 4, headR, headY - headR + 4, headR + 8, headY - headR - 12);
      g.fillEllipse(0, headY - headR + 2, headR * 2.2, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(headR + 8, headY - headR - 12, 4);
    }


    // Face details
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(-4, headY - 2, 2); // left eye
    g.fillCircle(4, headY - 2, 2);  // right eye

    // Mud patches
    if (clothing.muddy) {
      g.fillStyle(0x5c4033, 0.85); // brown mud
      // shirt patch
      g.fillCircle(-4, baseY + 12, 5);
      g.fillCircle(2, baseY + 18, 4);
      // face patch
      g.fillCircle(5, headY + 3, 3);
      // leg patch
      g.fillCircle(-6 + legSwing, baseY + bodyH + 6, 4);
    }

    // Hoverboard
    if (this._hoverboardActive) {
      this._drawHoverboard(g, bodyH + baseY + legH + 6);
    }
  }

  _drawHoverboard(g, y) {
    g.fillStyle(CONFIG.COLORS.NEON_GREEN, 0.9);
    g.fillRoundedRect(-24, y, 48, 10, 4);
    g.fillStyle(CONFIG.COLORS.NEON_GREEN, 0.3);
    g.fillEllipse(0, y + 10, 48, 20); // glow
    g.fillStyle(0x001100, 1);
    g.fillCircle(-16, y + 5, 3);
    g.fillCircle(16, y + 5, 3);
  }

  _drawShieldBubble() {
    const g = this._shieldGfx;
    g.lineStyle(3, CONFIG.COLORS.NEON_CYAN, 0.8);
    g.strokeCircle(0, -20, 45);
    g.lineStyle(1, CONFIG.COLORS.NEON_CYAN, 0.3);
    g.strokeCircle(0, -20, 50);
  }

  _setupInput() {
    bus.on('input:left',  () => this._onLeft());
    bus.on('input:right', () => this._onRight());
    bus.on('input:jump',  () => this._onJump());
  }

  _onLeft() {
    if (!this._alive || this._state === STATE.DEATH) return;
    if (this._lane > 0) {
      this._lane--;
      this._targetWorldX = CONFIG.LANES.POSITIONS[this._lane];
      this._scene.sound && bus.emit('sfx:play', { key: 'sfx_lane' });
    }
  }

  _onRight() {
    if (!this._alive || this._state === STATE.DEATH) return;
    if (this._lane < 2) {
      this._lane++;
      this._targetWorldX = CONFIG.LANES.POSITIONS[this._lane];
      bus.emit('sfx:play', { key: 'sfx_lane' });
    }
  }

  _onJump() {
    if (!this._alive || this._state === STATE.DEATH) return;
    if (this._isGrounded) {
      this._velY = CONFIG.PLAYER.JUMP_VELOCITY;
      this._isGrounded = false;
      this.setState(STATE.JUMP);
      bus.emit('sfx:play', { key: 'sfx_jump' });
    }
  }

  setState(newState) {
    if (this._state === newState) return;
    this._state = newState;
    this._animFrame = 0;
    this._updateHitbox();
    this._drawPlayerBody(newState);
  }

  _updateHitbox() {
    const hbKey = this._state === STATE.JUMP ? 'jump' : 'run';
    const [w, h, ox, oy] = CONFIG.PLAYER.HITBOX[hbKey];
    this._hitbox.width = w;
    this._hitbox.height = h;
  }

  update(delta) {
    if (!this._alive) return;

    // Animate
    this._animTimer += delta;
    if (this._animTimer >= this._animSpeed) {
      this._animTimer -= this._animSpeed;
      this._animFrame++;
      if (this._state === STATE.RUN || this._state === STATE.JUMP) {
        this._drawPlayerBody(this._state);
      }
    }

    // Lane switching — smooth lerp in world space
    const t = Math.min(delta / CONFIG.LANES.SWITCH_DURATION, 1);
    this._worldX = lerp(this._worldX, this._targetWorldX, clamp(t * 8, 0, 1));

    // Floor detection
    const floorY = this._scene.getFloorY(this._lane, 0);

    // Gravity & jump arc in world space
    if (!this._isGrounded || this._state === STATE.JUMP || this._worldY > floorY) {
      this._velY -= CONFIG.PLAYER.GRAVITY * (delta / 1000); // Gravity pulls down
      this._worldY += this._velY * (delta / 1000);

      // Landing
      if (this._worldY <= floorY) {
        this._worldY = floorY;
        this._velY = 0;
        this._isGrounded = true;
        if (this._state === STATE.JUMP) this.setState(STATE.RUN);
      }
    } else {
      // Grounded tracking (snaps up/down ramps or stairs)
      this._worldY = floorY;
      this._isGrounded = true;
      this._velY = 0;
    }

    // Invincibility timer
    if (this._invincibleTimer > 0) {
      this._invincibleTimer -= delta;
      const visible = Math.floor(this._invincibleTimer / 100) % 2 === 0;
      this._container.setAlpha(visible ? 0.4 : 1);
      if (this._invincibleTimer <= 0) this._container.setAlpha(1);
    }

    // Project 3D coordinates to 2D screen coordinates
    const screenW = this._scene.sys.game.canvas.width;
    const screenH = this._scene.sys.game.canvas.height;
    const proj = Projection.project(this._worldX, this._worldY, 0, screenW, screenH);

    this._container.x = proj.x;
    this._container.y = proj.y;
    this._container.setScale(proj.scale);

    // Update hitbox position
    this._hitbox.x = this._container.x;
    this._hitbox.y = this._container.y - 30 * proj.scale;
    // Hitbox scale isn't native, so we just use it for collision center later
  }

  /** Called on obstacle collision */
  hit() {
    if (this._invincibleTimer > 0) return false; // still invincible
    if (this._shieldActive) {
      this._shieldActive = false;
      this._shieldGfx.setAlpha(0);
      bus.emit('powerup:shieldConsumed');
      bus.emit('particle:shieldHit', { x: this._container.x, y: this._container.y - 20 });
      bus.emit('camera:shake', { intensity: 0.3 });
      bus.emit('sfx:play', { key: 'sfx_shield' });
      return false;
    }
    this.setState(STATE.STUMBLE);
    this._invincibleTimer = CONFIG.PLAYER.INVINCIBLE_DURATION;
    bus.emit('player:stumble');
    bus.emit('camera:shake', { intensity: 0.7 });
    bus.emit('camera:hitStop');
    bus.emit('camera:flash', { color: 0xff4400, duration: 150 });
    bus.emit('particle:explosion', { x: this._container.x, y: this._container.y });
    bus.emit('sfx:play', { key: 'sfx_hit' });

    // Return to running after stumble
    this._scene.time.delayedCall(500, () => {
      if (this._state === STATE.STUMBLE) this.setState(STATE.RUN);
    });
    return true;
  }

  die() {
    if (!this._alive) return;
    this._alive = false;
    this.setState(STATE.DEATH);
    bus.emit('player:death');
    bus.emit('camera:shake', { intensity: 1 });
    bus.emit('sfx:play', { key: 'sfx_death' });
    // Death animation: spin and fall
    this._scene.tweens.add({
      targets: this._container,
      angle: 360,
      y: CONFIG.PLAYER.GROUND_Y + 200,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
    });
  }

  activateShield() {
    this._shieldActive = true;
    this._shieldGfx.setAlpha(1);
    this._scene.tweens.add({
      targets: this._shieldGfx,
      alpha: 0.7,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });
  }

  activateHoverboard() {
    this._hoverboardActive = true;
    this._drawPlayerBody(this._state);
    // Make hover slightly above ground
    this._scene.tweens.add({
      targets: this._container,
      y: CONFIG.PLAYER.GROUND_Y - 20,
      duration: 300,
      ease: 'Sine.easeOut',
    });
    // Board pulse
    const pulseTween = this._scene.tweens.add({
      targets: this._boardGfx,
      alpha: 0.6,
      yoyo: true,
      repeat: -1,
      duration: 400,
    });
    return () => {
      this._hoverboardActive = false;
      pulseTween.stop();
      this._boardGfx.setAlpha(0);
      this._scene.tweens.add({
        targets: this._container,
        y: CONFIG.PLAYER.GROUND_Y,
        duration: 300,
      });
      this._drawPlayerBody(this._state);
    };
  }

  deactivateShield() {
    this._shieldActive = false;
    this._shieldGfx.setAlpha(0);
  }

  get worldX()   { return this._worldX; }
  get worldY()   { return this._worldY; }
  get z()        { return 0; }
  get hitbox()   { return this._hitbox; }
  get lane()     { return this._lane; }
  get alive()    { return this._alive; }
  get state()    { return this._state; }
  get isSliding(){ return this._state === STATE.SLIDE; }
  get isJumping(){ return this._state === STATE.JUMP; }

  destroy() {
    this._container.destroy();
    this._hitbox.destroy();
    if (this._moneyEmitter) {
      this._moneyEmitter.destroy();
    }
  }
}
