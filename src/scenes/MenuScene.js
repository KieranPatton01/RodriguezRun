// =============================================================
// MenuScene.js — Main menu with animated city background
// Play, Settings, Stats, Achievements, Leaderboard
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { GameButton, IconButton } from '../ui/Buttons.js';
import { Transitions } from '../ui/Transitions.js';
import { SaveManager } from '../managers/SaveManager.js';
import { bus } from '../utils/EventBus.js';
import { getAudioContext } from '../utils/AudioSynth.js';
import { ACHIEVEMENTS_META } from '../ui/AchievementPopup.js';
import { Player } from '../entities/Player.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  init() {
    // Retrieve or create save manager (shared via registry)
    if (!this.game.registry.get('saveManager')) {
      this.game.registry.set('saveManager', new SaveManager());
    }
    this._save = this.game.registry.get('saveManager');
  }

  create() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    bus.clear(); // reset all event listeners

    Transitions.fadeIn(this, 600);
    this._buildBackground();
    this._buildTitle();
    this._buildButtons();
    this._buildHighScore();
    this._buildPWAPrompt();
    this._animateBackground();
    this._checkDailyReward();

    // SFX bus listener for this scene
    bus.on('sfx:play', ({ key }) => {
      // Audio placeholder — Web Audio will be used
      this._playClickSound(key);
    });
  }

  _buildBackground() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;

    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(C.SKY_TOP, C.SKY_TOP, 0x1a3a5c, 0x1a3a5c, 1);
    sky.fillRect(0, 0, WIDTH, HEIGHT * 0.65);
    sky.fillStyle(C.GROUND, 1);
    sky.fillRect(0, HEIGHT * 0.65, WIDTH, HEIGHT * 0.35);

    // Stars
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT * 0.5;
      const r = Math.random() * 1.5 + 0.3;
      const a = Math.random() * 0.7 + 0.3;
      const star = this.add.circle(x, y, r, 0xffffff, a);
      this.tweens.add({
        targets: star,
        alpha: a * 0.3,
        yoyo: true,
        repeat: -1,
        duration: 1000 + Math.random() * 2000,
        delay: Math.random() * 2000,
      });
    }

    // Far city silhouette
    this._drawMenuBuildings();

    // Ground lane markers
    const ground = this.add.graphics();
    ground.fillStyle(0x0d0d1f, 1);
    ground.fillRect(0, HEIGHT * 0.72, WIDTH, HEIGHT * 0.28);
    ground.lineStyle(2, C.NEON_CYAN, 0.4);
    ground.lineBetween(0, HEIGHT * 0.72, WIDTH, HEIGHT * 0.72);
    // Lane lines scrolling
    this._laneLines = [];
    for (let i = 0; i < 8; i++) {
      const line = this.add.rectangle(
        i * (WIDTH / 6), HEIGHT * 0.78,
        (WIDTH / 6) - 10, 3,
        C.NEON_CYAN, 0.25
      );
      this._laneLines.push(line);
    }

    // Atmospheric neon light shafts
    [0.2, 0.5, 0.8].forEach((fx, i) => {
      const shaft = this.add.graphics();
      shaft.fillGradientStyle(
        CONFIG.COLORS.NEON_CYAN, CONFIG.COLORS.NEON_CYAN,
        0x000000, 0x000000, 0.08, 0.08, 0, 0
      );
      shaft.fillTriangle(
        WIDTH * fx, HEIGHT * 0.2,
        WIDTH * fx - 30, HEIGHT * 0.75,
        WIDTH * fx + 30, HEIGHT * 0.75
      );
      this.tweens.add({
        targets: shaft,
        alpha: 0.3,
        yoyo: true,
        repeat: -1,
        duration: 2000 + i * 700,
        delay: i * 400,
      });
    });
    
    // Running Sara sprite removed as per request
  }

  _drawMenuBuildings() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const g = this.add.graphics();
    let x = 0;
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return Math.abs(seed) / 0xffffffff;
    };

    while (x < WIDTH + 60) {
      const w = 25 + rand() * 50;
      const h = 80 + rand() * 220;
      const buildY = HEIGHT * 0.72 - h;

      // Building body
      g.fillStyle(0x0a1628, 1);
      g.fillRect(x, buildY, w, h);

      // Windows
      for (let wy = buildY + 8; wy < HEIGHT * 0.72 - 12; wy += 18) {
        for (let wx = x + 5; wx < x + w - 8; wx += 14) {
          if (rand() > 0.35) {
            const wc = rand() > 0.6 ? 0x00d4ff : rand() > 0.5 ? 0xffbe0b : 0xff006e;
            g.fillStyle(wc, rand() * 0.6 + 0.2);
            g.fillRect(wx, wy, 6, 8);
          }
        }
      }

      // Roof antenna or dome
      if (rand() > 0.6) {
        g.lineStyle(1, 0x00d4ff, 0.6);
        g.lineBetween(x + w / 2, buildY, x + w / 2, buildY - 20);
        g.fillStyle(0xff006e, 0.8);
        g.fillCircle(x + w / 2, buildY - 22, 4);
        // Blink
        const dot = this.add.circle(x + w / 2, buildY - 22, 3, 0xff006e);
        this.tweens.add({ targets: dot, alpha: 0, yoyo: true, repeat: -1, duration: 800 + rand() * 800 });
      }

      x += w + 2 + rand() * 8;
    }
  }

  _buildTitle() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;

    // Main title
    this._titleText = this.add.text(WIDTH / 2, HEIGHT * 0.12, 'RODRIGUEZ', {
      fontFamily: '"Orbitron", monospace',
      fontSize: `${Math.min(72, WIDTH * 0.14)}px`,
      fontStyle: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { x: 4, y: 4, color: '#00d4ff', blur: 25, fill: true },
      letterSpacing: 2,
    }).setOrigin(0.5);

    this._subtitleText = this.add.text(WIDTH / 2, HEIGHT * 0.22, 'R U N', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '54px',
      fontStyle: 'bold',
      fill: '#00d4ff',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { x: 4, y: 4, color: '#00d4ff', blur: 20, fill: true },
      letterSpacing: 28,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT * 0.31, "SARA'S SAFESTAY ADVENTURE", {
      fontFamily: '"Orbitron", monospace', fontSize: '14px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      letterSpacing: 3,
    }).setOrigin(0.5);

    // Title float animation
    this.tweens.add({
      targets: [this._titleText, this._subtitleText],
      y: (t) => t.y - 6,
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });
  }

  _buildButtons() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const C = CONFIG.COLORS;
    const bx = WIDTH / 2;

    // Play button — prominent
    this._playBtn = new GameButton(this, bx, HEIGHT * 0.47, '▶  PLAY', {
      width: 240,
      height: 64,
      color: C.NEON_CYAN,
      textColor: '#0d1b2a',
      fontSize: '18px',
      depth: 60,
      onClick: () => this._startGame(),
    });

    // Skin button
    this._skinBtn = new GameButton(this, bx, HEIGHT * 0.58, '👤  SKINS', {
      width: 240, height: 64, color: C.NEON_MAGENTA, textColor: '#ffffff', fontSize: '18px', depth: 60,
      onClick: () => this._openSkins(),
    });

    // Secondary buttons
    this._settingsBtn = new GameButton(this, bx, HEIGHT * 0.69, '⚙  SETTINGS', {
      width: 200, height: 48, color: C.UI_PANEL, textColor: '#ffffff',
      onClick: () => this._openSettings(),
    });
    this._statsBtn = new GameButton(this, bx, HEIGHT * 0.78, '📊  STATS', {
      width: 200, height: 48, color: C.UI_PANEL, textColor: '#ffffff',
      onClick: () => this._openStats(),
    });

    // Bottom icon buttons
    const iconY = HEIGHT * 0.91;
    this._leaderBtn = new IconButton(this, WIDTH / 2 - 70, iconY, '🏆',
      () => this._openLeaderboard(), C.NEON_AMBER);
    this._achieveBtn = new IconButton(this, WIDTH / 2, iconY, '🎖',
      () => this._openAchievements(), C.NEON_GREEN);
    this._cheatBtn = new IconButton(this, WIDTH / 2 + 70, iconY, '⌨️',
      () => this._openCheats(), C.NEON_MAGENTA);

    // Mobile disclaimer
    if (this.sys.game.device.os.android || this.sys.game.device.os.iOS || window.innerWidth < 600) {
      this.add.text(WIDTH / 2, HEIGHT - 15, "I built this for the stinkystay pcs, it may be cooked on mobile", {
        fontFamily: 'sans-serif', fontSize: '9px', fill: '#ff4444', align: 'center', wordWrap: { width: WIDTH - 20 }
      }).setOrigin(0.5).setDepth(100);
    }

    // Entrance animations
    [this._playBtn._container, this._skinBtn._container, this._settingsBtn._container, this._statsBtn._container, this._leaderBtn._container, this._achieveBtn._container, this._cheatBtn._container].forEach((c, i) => {
      c.setAlpha(0).setY(c.y + 30);
      this.tweens.add({
        targets: c,
        alpha: 1, y: c.y - 30,
        duration: 400, delay: 200 + i * 100,
        ease: 'Back.easeOut',
      });
    });
  }

  _buildHighScore() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const hs = this._save.highScore;

    this._hsBg = this.add.graphics().setDepth(55);
    this._hsBg.fillStyle(0x000000, 0.45);
    this._hsBg.fillRoundedRect(WIDTH / 2 - 120, HEIGHT * 0.34, 240, 70, 8);

    this._hsText = this.add.text(WIDTH / 2, HEIGHT * 0.34 + 12, `HIGH SCORE: ${hs.toLocaleString()}`, {
      fontFamily: '"Orbitron", monospace', fontSize: '14px',
      fill: '#ffbe0b',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: { x: 0, y: 0, color: '#ffbe0b', blur: 8, fill: true },
    }).setOrigin(0.5, 0).setDepth(56);

    const totalEuros = this._save.get('totalCoins') || 0;
    this._eurosText = this.add.text(WIDTH / 2, HEIGHT * 0.34 + 36, `EUROS: ${totalEuros.toLocaleString()}`, {
      fontFamily: '"Orbitron", monospace', fontSize: '14px',
      fill: '#00d4ff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(56);
  }

  _buildPWAPrompt() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this._showInstallBanner(deferredPrompt);
    });
  }

  _showInstallBanner(prompt) {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const banner = this.add.container(WIDTH / 2, HEIGHT - 16).setDepth(80);

    const bg = this.add.graphics();
    bg.fillStyle(CONFIG.COLORS.NEON_AMBER, 0.9);
    bg.fillRoundedRect(-160, -32, 320, 36, 8);

    const txt = this.add.text(0, -14, '📲  Install RodriguezRun', {
      font: '12px "Orbitron", monospace',
      fill: '#0d1b2a',
    }).setOrigin(0.5, 0);

    banner.add([bg, txt]);
    banner.setInteractive(new Phaser.Geom.Rectangle(-160, -32, 320, 36), Phaser.Geom.Rectangle.Contains);
    banner.on('pointerup', () => {
      prompt.prompt();
      prompt.userChoice.then(() => banner.destroy());
    });

    // Slide up
    banner.y = HEIGHT + 50;
    this.tweens.add({ targets: banner, y: HEIGHT - 24, duration: 400, ease: 'Back.easeOut', delay: 1000 });
  }

  _animateBackground() {
    // Scroll lane lines
    this.time.addEvent({
      loop: true,
      delay: 16,
      callback: () => {
        this._laneLines.forEach(line => {
          line.x -= 2;
          if (line.x < -60) line.x = this.sys.game.canvas.width + 60;
        });
      },
    });
  }

  _checkDailyReward() {
    const streak = this._save.claimDailyReward();
    if (streak) {
      const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
      this.time.delayedCall(800, () => {
        const panel = this.add.container(WIDTH / 2, HEIGHT / 2).setDepth(100);
        const bg = this.add.graphics();
        bg.fillStyle(0x0d1b2a, 0.97);
        bg.fillRoundedRect(-140, -80, 280, 160, 14);
        bg.lineStyle(2, CONFIG.COLORS.NEON_AMBER, 0.9);
        bg.strokeRoundedRect(-140, -80, 280, 160, 14);

        const title = this.add.text(0, -55, '🎁 DAILY REWARD', {
          font: 'bold 14px "Orbitron", monospace', fill: '#ffbe0b',
        }).setOrigin(0.5);
        const streakTxt = this.add.text(0, -20, `Day ${streak} Streak!`, {
          font: '20px "Orbitron", monospace', fill: '#ffffff',
        }).setOrigin(0.5);
        const reward = this.add.text(0, 15, `+${streak * 50} COINS`, {
          font: 'bold 24px "Orbitron", monospace', fill: '#ffbe0b',
        }).setOrigin(0.5);

        const closeBtn = this.add.text(0, 55, 'CLAIM', {
          font: 'bold 13px "Orbitron", monospace',
          fill: '#0d1b2a',
          backgroundColor: '#ffbe0b',
          padding: { x: 16, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerup', () => { panel.destroy(); });

        panel.add([bg, title, streakTxt, reward, closeBtn]);
        Transitions.popIn(this, panel);
      });
    }
  }

  _startGame() {
    const qrPrompt = document.getElementById('desktop-qr-prompt');
    if (qrPrompt) qrPrompt.remove();

    if (this._save.get('hasSeenTutorial') === false) {
      Transitions.fadeOut(this, 'TutorialScene', {}, 500);
    } else {
      Transitions.fadeOut(this, 'GameScene', {}, 500);
    }
  }

  _openSettings() {
    this.scene.launch('SettingsScene');
    this.scene.pause();
  }

  _openStats() {
    this.scene.launch('StatsScene');
    this.scene.pause();
  }

  _openLeaderboard() {
    this._showLeaderboard();
  }

  _openAchievements() {
    this._showAchievements();
  }

  _openCheats() {
    this.scene.pause();
    this.scene.launch('CheatsScene');
  }

  _openSkins() {
    this._showSkins();
  }

  _showSkins() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const panel = this.add.container(WIDTH / 2, HEIGHT / 2).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a, 0.97);
    bg.fillRoundedRect(-200, -250, 400, 500, 14);
    bg.lineStyle(2, CONFIG.COLORS.NEON_MAGENTA, 0.9);
    bg.strokeRoundedRect(-200, -250, 400, 500, 14);

    const title = this.add.text(0, -220, '👤 SKINS', {
      fontFamily: '"Orbitron", monospace', fontSize: '24px', fontStyle: 'bold', fill: '#ff00ff',
    }).setOrigin(0.5);

    const balanceTxt = this.add.text(0, -190, `EUROS: ${this._save.get('totalCoins').toLocaleString()}`, {
      fontFamily: '"Orbitron", monospace', fontSize: '18px', fontStyle: 'bold', fill: '#00d4ff',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(0, 220, '✕ CLOSE', {
      fontFamily: '"Orbitron", monospace', fontSize: '18px', fill: '#ffffff88',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    panel.add([bg, title, balanceTxt, closeBtn]);

    const skins = [
      { id: 'default', name: 'Safestay-Sara', price: 0 },
      { id: 'rugby_sara', name: 'Rugby Sara', price: 1000 },
      { id: 'stinky_sara', name: 'Stinky Sara', price: 1500 },
      { id: 'senthil', name: 'Safestay-Senthil', price: 2500 },
      { id: 'tj', name: 'TJ', price: 5000 },
      { id: 'stranger_sara', name: 'Stranger Sara', price: 10000 },
      { id: 'eras_tour_sara', name: 'Eras Tour Sara', price: 15000 },
      { id: 'fiancee_sara', name: 'Fiancée Fernandez', price: 20000 },
      { id: 'sleepy_sara', name: 'Sleepy Sara', price: 25000 },
      { id: 'abid', name: 'Abid', price: 50000 },
    ];

    let currentIndex = skins.findIndex(s => s.id === this._save.get('activeSkin'));
    if (currentIndex === -1) currentIndex = 0;

    const nameTxt = this.add.text(0, -150, '', {
      fontFamily: '"Orbitron", monospace', fontSize: '24px', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5);
    
    const priceTxt = this.add.text(0, -125, '', {
      fontFamily: '"Orbitron", monospace', fontSize: '18px', fill: '#ffbe0b',
    }).setOrigin(0.5);

    // Preview graphics
    const previewGfx = this.add.graphics({ x: 0, y: -30 });
    previewGfx.setScale(2.6); // adjusted preview
    panel.add([nameTxt, priceTxt, previewGfx]);

    let animFrame = 0;
    const animTimer = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        animFrame++;
        previewGfx.clear();
        // Draw centered slightly adjusted for Y offset
        Player.drawSkin(previewGfx, skins[currentIndex].id, animFrame, 1);
      }
    });

    closeBtn.on('pointerup', () => {
      animTimer.remove();
      panel.destroy();
    });

    // Action button
    const actionBtnBg = this.add.graphics();
    const actionTxt = this.add.text(0, 165, '', {
      fontFamily: '"Orbitron", monospace', fontSize: '22px', fontStyle: 'bold', fill: '#0d1b2a',
    }).setOrigin(0.5);
    const hitZone = this.add.zone(0, 165, 200, 50).setInteractive({ useHandCursor: true });
    
    panel.add([actionBtnBg, actionTxt, hitZone]);

    const updateCarousel = () => {
      const skin = skins[currentIndex];
      const isUnlocked = this._save.get('unlockedSkins').includes(skin.id);
      const isActive = this._save.get('activeSkin') === skin.id;

      nameTxt.setText(skin.name);
      nameTxt.setFill(isActive ? '#00d4ff' : '#ffffff');
      
      priceTxt.setText(isUnlocked ? 'UNLOCKED' : `PRICE: ${skin.price} €`);
      priceTxt.setFill(isUnlocked ? '#27ae60' : '#ffbe0b');

      actionBtnBg.clear();
      let btnColor = isActive ? 0x555555 : (isUnlocked ? 0x00d4ff : 0xffbe0b);
      actionBtnBg.fillStyle(btnColor, 1);
      actionBtnBg.fillRoundedRect(-100, 140, 200, 50, 10);
      
      actionTxt.setText(isActive ? 'EQUIPPED' : (isUnlocked ? 'EQUIP' : 'BUY SKIN'));
      balanceTxt.setText(`EUROS: ${this._save.get('totalCoins').toLocaleString()}`);
    };

    hitZone.on('pointerup', () => {
      const skin = skins[currentIndex];
      const isUnlocked = this._save.get('unlockedSkins').includes(skin.id);
      const isActive = this._save.get('activeSkin') === skin.id;

      if (isActive) return;
      if (isUnlocked) {
        this._save.setActiveSkin(skin.id);
        updateCarousel();
      } else {
        if (this._save.spendCoins(skin.price)) {
          this._save.unlockSkin(skin.id);
          this._save.setActiveSkin(skin.id);
          if (this._eurosText) {
            this._eurosText.setText(`EUROS: ${this._save.get('totalCoins').toLocaleString()}`);
          }
          updateCarousel();
        } else {
          actionTxt.setText('NOT ENOUGH').setFill('#ff0000');
          this.time.delayedCall(1000, () => {
            if (actionTxt.active) updateCarousel();
          });
        }
      }
    });

    // Arrows
    const leftArrow = this.add.text(-150, -15, '◀', {
      font: '42px sans-serif', fill: '#00d4ff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    const rightArrow = this.add.text(150, -15, '▶', {
      font: '42px sans-serif', fill: '#00d4ff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leftArrow.on('pointerup', () => {
      currentIndex = (currentIndex - 1 + skins.length) % skins.length;
      updateCarousel();
    });
    rightArrow.on('pointerup', () => {
      currentIndex = (currentIndex + 1) % skins.length;
      updateCarousel();
    });

    panel.add([leftArrow, rightArrow]);

    // Setup initial state
    updateCarousel();

    Transitions.popIn(this, panel);
  }

  _showLeaderboard() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const save = this._save;
    const panel = this.add.container(WIDTH / 2, HEIGHT / 2).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a, 0.97);
    bg.fillRoundedRect(-160, -200, 320, 400, 14);
    bg.lineStyle(2, CONFIG.COLORS.NEON_AMBER, 0.9);
    bg.strokeRoundedRect(-160, -200, 320, 400, 14);

    const title = this.add.text(0, -175, '🏆 LEADERBOARD', {
      font: 'bold 14px "Orbitron", monospace', fill: '#ffbe0b',
    }).setOrigin(0.5);

    const entries = [
      { rank: 1, name: 'YOU', score: save.highScore },
    ];

    const entryItems = entries.map((e, i) => {
      const colors = ['#ffbe0b', '#aaaacc', '#cc7744'];
      return this.add.text(0, -130 + i * 50,
        `${e.rank}. ${e.name.padEnd(10)} ${e.score.toLocaleString()}`, {
        font: '12px "Orbitron", monospace',
        fill: colors[i] || '#ffffff77',
      }).setOrigin(0.5);
    });

    const closeBtn = this.add.text(0, 175, '✕ CLOSE', {
      font: '12px "Orbitron", monospace', fill: '#ffffff88',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => panel.destroy());

    panel.add([bg, title, closeBtn, ...entryItems]);
    Transitions.popIn(this, panel);
  }

  _showAchievements() {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const panelW = 360, panelH = 520;
    const px = WIDTH / 2, py = HEIGHT / 2;

    const panel = this.add.container(px, py).setDepth(100);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a, 0.97);
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 14);
    bg.lineStyle(2, CONFIG.COLORS.NEON_GREEN, 0.9);
    bg.strokeRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 14);

    const title = this.add.text(0, -panelH/2 + 30, '🎖 ACHIEVEMENTS', {
      fontFamily: '"Orbitron", monospace', fontSize: '20px', fontStyle: 'bold', fill: '#06d6a0',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(0, panelH/2 - 25, '✕ CLOSE', {
      fontFamily: '"Orbitron", monospace', fontSize: '14px', fontStyle: 'bold', fill: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => {
      this.input.off('wheel');
      panel.destroy();
    });

    panel.add([bg, title, closeBtn]);

    // Scroll area is relative to panel centre
    // Panel top-left in panel-space = (-panelW/2, -panelH/2)
    const listRelX = -panelW/2 + 20;  // left edge of list, relative to panel
    const listRelY = -panelH/2 + 65;  // top edge of list, relative to panel
    const listW = panelW - 50;        // width leaving room for scrollbar
    const listH = panelH - 125;       // height leaving room for title + close
    const itemH = 58;
    const achKeys = Object.entries(ACHIEVEMENTS_META);
    const totalH = achKeys.length * itemH;

    // Scrollable inner container, relative to panel
    const scrollCont = this.add.container(listRelX, listRelY);
    panel.add(scrollCont);

    achKeys.forEach(([id, meta], index) => {
      const isUnlocked = this._save.getAchievement(id);
      const color = isUnlocked ? '#ffffff' : '#888888';
      const icon = isUnlocked ? meta.icon : '🔒';
      const iy = index * itemH;

      const itemBg = this.add.graphics();
      itemBg.fillStyle(isUnlocked ? 0x27ae60 : 0x333333, 0.2);
      itemBg.fillRoundedRect(0, iy, listW, itemH - 6, 8);
      itemBg.lineStyle(1, isUnlocked ? 0x06d6a0 : 0x555555, 0.5);
      itemBg.strokeRoundedRect(0, iy, listW, itemH - 6, 8);

      const txt = this.add.text(12, iy + 14, `${icon} ${meta.title}`, {
        fontFamily: '"Orbitron", monospace', fontSize: '14px', fontStyle: 'bold', fill: color,
      }).setOrigin(0, 0.5);

      const descTxt = this.add.text(12, iy + 34, meta.desc, {
        fontFamily: '"Orbitron", monospace', fontSize: '11px', fill: isUnlocked ? '#dddddd' : '#777777',
      }).setOrigin(0, 0.5);

      scrollCont.add([itemBg, txt, descTxt]);
    });

    // Geometry mask – must use absolute screen coords
    const maskAbsX = px + listRelX;
    const maskAbsY = py + listRelY;
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(maskAbsX, maskAbsY, listW + 5, listH);
    scrollCont.setMask(maskShape.createGeometryMask());

    // Scrollbar track (panel-relative)
    const trackRelX = panelW/2 - 20;
    const trackGfx = this.add.graphics();
    trackGfx.fillStyle(0x333333, 0.6);
    trackGfx.fillRoundedRect(trackRelX, listRelY, 8, listH, 4);
    panel.add(trackGfx);

    const thumbGfx = this.add.graphics();
    panel.add(thumbGfx);

    let scrollY = 0;
    const maxScroll = Math.max(0, totalH - listH);
    const thumbH = Math.max(30, (listH / Math.max(totalH, 1)) * listH);

    const updateScroll = () => {
      scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
      scrollCont.y = listRelY - scrollY;
      const thumbY = listRelY + (scrollY / Math.max(maxScroll, 1)) * (listH - thumbH);
      thumbGfx.clear();
      thumbGfx.fillStyle(0x06d6a0, 0.9);
      thumbGfx.fillRoundedRect(trackRelX, thumbY, 8, thumbH, 4);
      // Update mask position as scroll container moves
      maskShape.clear();
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(maskAbsX, maskAbsY, listW + 5, listH);
    };

    updateScroll();

    // Arrow buttons (panel-relative)
    const upBtn = this.add.text(trackRelX + 4, listRelY - 4, '▲', {
      font: '14px sans-serif', fill: '#06d6a0',
    }).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    upBtn.on('pointerdown', () => { scrollY -= 60; updateScroll(); });

    const downBtn = this.add.text(trackRelX + 4, listRelY + listH + 4, '▼', {
      font: '14px sans-serif', fill: '#06d6a0',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    downBtn.on('pointerdown', () => { scrollY += 60; updateScroll(); });

    panel.add([upBtn, downBtn]);

    // Mouse wheel
    this.input.on('wheel', (_ptr, _objs, _dx, dy) => {
      if (!panel.active) return;
      scrollY += dy * 0.5;
      updateScroll();
    });

    Transitions.popIn(this, panel);
  }



  _showMessage(title, body) {
    const { width: WIDTH, height: HEIGHT } = this.sys.game.canvas;
    const panel = this.add.container(WIDTH / 2, HEIGHT / 2).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a, 0.97);
    bg.fillRoundedRect(-140, -80, 280, 160, 14);
    bg.lineStyle(2, CONFIG.COLORS.NEON_CYAN, 0.9);
    bg.strokeRoundedRect(-140, -80, 280, 160, 14);
    const t1 = this.add.text(0, -55, title, {
      font: 'bold 16px "Orbitron", monospace', fill: '#00d4ff',
    }).setOrigin(0.5);
    const t2 = this.add.text(0, -10, body, {
      font: '11px "Orbitron", monospace', fill: '#aaaacc', align: 'center',
    }).setOrigin(0.5);
    const closeBtn = this.add.text(0, 55, '✕ CLOSE', {
      font: '12px "Orbitron", monospace', fill: '#ffffff88',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => panel.destroy());
    panel.add([bg, t1, t2, closeBtn]);
    Transitions.popIn(this, panel);
  }

  _playClickSound(key) {
    // Web Audio API direct tone generation (no file needed)
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const tones = {
        sfx_click: [440, 0.08],
        sfx_hover: [330, 0.03],
        sfx_jump:  [550, 0.1],
        sfx_coin:  [880, 0.06],
        sfx_hit:   [110, 0.15],
        sfx_slide: [220, 0.06],
        sfx_death: [55,  0.2],
        sfx_lane:  [660, 0.04],
      };
      const [freq, vol] = tones[key] || [440, 0.05];
      const save = this.game.registry.get('saveManager');
      const muted = save?.getSetting('muted') || false;
      const sfxVol = save?.getSetting('sfxVolume') ?? 0.7;
      gain.gain.value = muted ? 0 : vol * sfxVol;
      osc.frequency.value = freq;
      osc.type = key === 'sfx_death' ? 'sawtooth' : 'sine';
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* silently fail */ }
  }

  shutdown() {
    bus.off('sfx:play');
  }
}
