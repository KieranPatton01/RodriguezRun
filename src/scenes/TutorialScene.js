// =============================================================
// TutorialScene.js — How to play, controls, and item carousels
// =============================================================

import Phaser from 'phaser';
import { CONFIG, POWERUP_TYPES } from '../config.js';
import { Transitions } from '../ui/Transitions.js';
import { Obstacle } from '../entities/Obstacle.js';
import { PowerUp } from '../entities/Powerup.js';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TutorialScene' });
  }

  init() {
    this._save = this.game.registry.get('saveManager');
  }

  create() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;

    Transitions.fadeIn(this, 300);

    // Dimmed background
    this.add.rectangle(WIDTH/2, HEIGHT/2, WIDTH, HEIGHT, 0x000000, 0.85).setDepth(70);

    // Panel
    const panelW = Math.min(WIDTH * 0.9, 800);
    const panelH = Math.min(HEIGHT * 0.85, 550);
    const px = WIDTH / 2 - panelW / 2;
    const py = HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics().setDepth(71);
    panel.fillStyle(0x0d1b2a, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 16);
    panel.lineStyle(2, C.NEON_CYAN, 0.7);
    panel.strokeRoundedRect(px, py, panelW, panelH, 16);

    this.add.text(WIDTH / 2, py + 30, 'HOW TO PLAY', {
      fontFamily: '"Orbitron", monospace', fontSize: '24px', fontStyle: 'bold', fill: '#00d4ff',
    }).setOrigin(0.5).setDepth(72);

    const divG = this.add.graphics().setDepth(72);
    divG.lineStyle(1, C.NEON_CYAN, 0.2);
    divG.lineBetween(px + 20, py + 60, px + panelW - 20, py + 60);

    // ── LAYOUT DIVISIONS ──
    const leftX = px + panelW * 0.25;
    const rightX = px + panelW * 0.75;

    // ==========================================
    // LEFT COLUMN: CONTROLS
    // ==========================================
    this.add.text(leftX, py + 90, '🎮 CONTROLS', {
      fontFamily: '"Orbitron", monospace', fontSize: '18px', fontStyle: 'bold', fill: '#ffbe0b',
    }).setOrigin(0.5).setDepth(72);

    // Visual Arrow Keys
    const arrowCenterY = py + 220;
    const keySize = 50;
    const keySpacing = 55;

    const drawKey = (x, y, label, icon) => {
      const g = this.add.graphics().setDepth(72);
      g.fillStyle(0x16213e, 1);
      g.fillRoundedRect(x - keySize/2, y - keySize/2, keySize, keySize, 8);
      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeRoundedRect(x - keySize/2, y - keySize/2, keySize, keySize, 8);

      this.add.text(x, y, icon, { fontFamily: 'sans-serif', fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5).setDepth(73);
      this.add.text(x, y + keySize/2 + 10, label, { fontFamily: '"Orbitron", monospace', fontSize: '10px', fill: '#aaaaaa' }).setOrigin(0.5).setDepth(73);
    };

    drawKey(leftX, arrowCenterY - keySpacing, 'JUMP', '▲');
    drawKey(leftX - keySpacing, arrowCenterY, 'LEFT', '◀');
    drawKey(leftX, arrowCenterY, 'SLIDE', '▼');
    drawKey(leftX + keySpacing, arrowCenterY, 'RIGHT', '▶');

    this.add.text(leftX, arrowCenterY + 100, 'Mobile: Swipe to move', {
      fontFamily: '"Orbitron", monospace', fontSize: '14px', fill: '#ffffff',
    }).setOrigin(0.5).setDepth(72);


    // ==========================================
    // RIGHT COLUMN: CAROUSELS
    // ==========================================
    const powerups = [
      { key: 'pu_magnet', label: 'MAGNET', desc: 'Pulls nearby coins', color: 0xff6b35 },
      { key: 'pu_double', label: '2X SCORE', desc: '2x score multiplier', color: 0xffbe0b },
      { key: 'pu_shield', label: 'SHIELD', desc: 'Invulnerability', color: 0x00d4ff },
      { key: 'pu_slow', label: 'SLOW-MO', desc: 'Reduces game speed', color: 0x8338ec },
      { key: 'pu_speed', label: 'TURBO', desc: 'High speed, auto-dodge', color: 0xff006e },
      { key: 'pu_hoverboard', label: 'HOVERBOARD', desc: 'Temporary invincibility, extra life', color: 0x06d6a0 }
    ];

    const obstacles = [
      { key: 'terrace', label: 'CAFE TERRACE', desc: 'Jump over or dodge' },
      { key: 'fountain', label: 'FOUNTAIN', desc: 'Jump over it!' },
      { key: 'olive_tree', label: 'OLIVE TREE', desc: 'Switch lanes to avoid' },
      { key: 'churro_cart', label: 'CHURRO CART', desc: 'Switch lanes to avoid' },
      { key: 'vespa', label: 'VESPA', desc: 'Switch lanes to avoid' },
      { key: 'flamenco', label: 'FLAMENCO DANCER', desc: 'Switch lanes to avoid' },
      { key: 'bull', label: 'BULL', desc: 'Switch lanes to avoid' },
      { key: 'pigeons', label: 'PIGEONS', desc: 'Slide under them!' },
      { key: 'tranvia', label: 'TRAM', desc: 'Switch lanes to avoid' },
      { key: 'stairs', label: 'STAIRS', desc: 'Use the ramp to climb up!' },
    ];

    // Dummy entities for rendering
    this._dummyPu = new PowerUp(this);
    this._dummyPu._gfx.setDepth(73).setVisible(true).setScale(1.5);
    
    this._dummyObs = new Obstacle(this);
    this._dummyObs._gfx.setDepth(73).setVisible(true).setScale(1.5);
    
    let puIndex = 0;
    let obsIndex = 0;

    // Powerups Carousel
    this.add.text(rightX, py + 90, '⚡ POWERUPS', {
      fontFamily: '"Orbitron", monospace', fontSize: '18px', fontStyle: 'bold', fill: '#06d6a0',
    }).setOrigin(0.5).setDepth(72);

    const puTitle = this.add.text(rightX, py + 130, '', { fontFamily: '"Orbitron", monospace', fontSize: '14px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(73);
    const puDesc = this.add.text(rightX, py + 220, '', { fontFamily: '"Orbitron", monospace', fontSize: '12px', fill: '#aaaaaa', align: 'center', wordWrap: { width: 250 } }).setOrigin(0.5).setDepth(73);
    
    this._dummyPu._gfx.x = rightX;
    this._dummyPu._gfx.y = py + 175;

    const updatePu = () => {
      const p = powerups[puIndex];
      puTitle.setText(p.label).setFill('#' + p.color.toString(16).padStart(6, '0'));
      puDesc.setText(p.desc);
      this._dummyPu._typeData = { key: p.key, color: p.color };
      this._dummyPu._draw();
    };

    this._createArrowButton(rightX - 100, py + 175, '◀', () => { puIndex = (puIndex - 1 + powerups.length) % powerups.length; updatePu(); });
    this._createArrowButton(rightX + 100, py + 175, '▶', () => { puIndex = (puIndex + 1) % powerups.length; updatePu(); });
    updatePu();


    // Obstacles Carousel
    this.add.text(rightX, py + 270, '🚧 OBSTACLES', {
      fontFamily: '"Orbitron", monospace', fontSize: '18px', fontStyle: 'bold', fill: '#ff006e',
    }).setOrigin(0.5).setDepth(72);

    const obsTitle = this.add.text(rightX, py + 300, '', { fontFamily: '"Orbitron", monospace', fontSize: '14px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(73);
    const obsDesc = this.add.text(rightX, py + 415, '', { fontFamily: '"Orbitron", monospace', fontSize: '12px', fill: '#aaaaaa', align: 'center', wordWrap: { width: 250 } }).setOrigin(0.5).setDepth(73);
    
    this._dummyObs._gfx.x = rightX;
    this._dummyObs._gfx.y = py + 370;

    const updateObs = () => {
      const o = obstacles[obsIndex];
      obsTitle.setText(o.label);
      obsDesc.setText(o.desc);
      // Dummy typeDef to prevent crashes
      this._dummyObs._typeDef = { w: 40, h: 60 };
      this._dummyObs._draw(o.key);
    };

    this._createArrowButton(rightX - 100, py + 360, '◀', () => { obsIndex = (obsIndex - 1 + obstacles.length) % obstacles.length; updateObs(); });
    this._createArrowButton(rightX + 100, py + 360, '▶', () => { obsIndex = (obsIndex + 1) % obstacles.length; updateObs(); });
    updateObs();


    // ==========================================
    // GOT IT BUTTON
    // ==========================================
    const btnW = 200;
    const btnH = 50;
    const btnX = WIDTH / 2;
    const btnY = py + panelH - 45;

    const btnBg = this.add.graphics().setDepth(72);
    btnBg.fillStyle(C.NEON_CYAN, 1);
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    this.add.text(btnX, btnY, 'GOT IT', {
      fontFamily: '"Orbitron", monospace', fontSize: '20px', fontStyle: 'bold', fill: '#0d1b2a',
    }).setOrigin(0.5).setDepth(73);

    const hitZone = this.add.zone(btnX, btnY, btnW, btnH)
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(74);

    hitZone.on('pointerup', () => {
      this._save.setHasSeenTutorial(true);
      Transitions.fadeOut(this, 'GameScene', {}, 500);
    });
  }

  _createArrowButton(x, y, text, onClick) {
    const btn = this.add.text(x, y, text, { fontFamily: 'sans-serif', fontSize: '28px', fill: '#00d4ff' })
      .setOrigin(0.5).setDepth(74).setInteractive({ useHandCursor: true });
    btn.on('pointerup', onClick);
    btn.on('pointerover', () => btn.setScale(1.2));
    btn.on('pointerout', () => btn.setScale(1));
  }

  update(time, delta) {
    if (this._dummyPu) {
      this._dummyPu._pulsT += delta * 0.005;
      this._dummyPu._draw();
    }
  }
}
