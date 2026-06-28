// =============================================================
// SettingsScene.js — Audio, accessibility, haptics settings
// =============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Transitions } from '../ui/Transitions.js';
import { bus } from '../utils/EventBus.js';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
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
    const panelW = 320, panelH = 420;
    const px = WIDTH / 2 - panelW / 2;
    const py = HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics().setDepth(71);
    panel.fillStyle(0x0d1b2a, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 16);
    panel.lineStyle(2, C.NEON_CYAN, 0.7);
    panel.strokeRoundedRect(px, py, panelW, panelH, 16);

    this.add.text(WIDTH / 2, py + 24, '⚙️ SETTINGS', {
      font: 'bold 16px "Orbitron", monospace', fill: '#00d4ff',
    }).setOrigin(0.5).setDepth(72);

    // Divider
    const divG = this.add.graphics().setDepth(72);
    divG.lineStyle(1, C.NEON_CYAN, 0.2);
    divG.lineBetween(px + 20, py + 52, px + panelW - 20, py + 52);

    const settings = this._save.settings;
    let rowY = py + 70;
    const rowH = 60;

    // Helper to draw a toggle row
    const addToggle = (label, settingKey, initial) => {
      const currentY = rowY;
      this.add.text(px + 24, currentY + 8, label, {
        font: '12px "Orbitron", monospace', fill: '#aaaacc',
      }).setDepth(72);
      const toggleBg = this.add.graphics().setDepth(72);
      const drawToggle = (on) => {
        toggleBg.clear();
        toggleBg.fillStyle(on ? C.NEON_CYAN : 0x334455, 1);
        toggleBg.fillRoundedRect(px + panelW - 70, currentY + 4, 48, 26, 13);
        toggleBg.fillStyle(0xffffff, 1);
        toggleBg.fillCircle(on ? px + panelW - 30 : px + panelW - 56, currentY + 17, 11);
      };
      let on = initial;
      drawToggle(on);
      const hitZone = this.add.zone(px + panelW - 46, currentY + 17, 60, 34)
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(73);
      hitZone.on('pointerup', () => {
        on = !on;
        this._save.setSetting(settingKey, on);
        drawToggle(on);
        bus.emit(`settings:${settingKey}`, { [settingKey === 'muted' ? 'muted' : 'value']: on });
      });
      rowY += rowH;
    };

    // Helper to draw a slider row
    const addSlider = (label, settingKey, initial) => {
      this.add.text(px + 24, rowY + 4, label, {
        font: '12px "Orbitron", monospace', fill: '#aaaacc',
      }).setDepth(72);
      const sliderX = px + 24;
      const sliderW = panelW - 48;
      const trackY = rowY + 34;

      // Track
      const trackG = this.add.graphics().setDepth(72);
      trackG.fillStyle(0x334455, 1);
      trackG.fillRoundedRect(sliderX, trackY, sliderW, 6, 3);

      // Fill
      const fillG = this.add.graphics().setDepth(72);
      let val = initial;
      const drawFill = (v) => {
        fillG.clear();
        fillG.fillStyle(C.NEON_CYAN, 1);
        fillG.fillRoundedRect(sliderX, trackY, sliderW * v, 6, 3);
      };
      drawFill(val);

      // Knob
      const knob = this.add.circle(sliderX + sliderW * val, trackY + 3, 11, 0xffffff).setDepth(73);

      // Interaction
      const hitZone = this.add.zone(sliderX + sliderW / 2, trackY + 3, sliderW, 30)
        .setOrigin(0.5).setInteractive({ useHandCursor: true, draggable: true }).setDepth(74);
      hitZone.on('pointermove', (ptr) => {
        if (ptr.isDown) {
          val = Math.max(0, Math.min(1, (ptr.x - sliderX) / sliderW));
          knob.x = sliderX + sliderW * val;
          drawFill(val);
          this._save.setSetting(settingKey, val);
          bus.emit(`settings:${settingKey}`, { v: val });
        }
      });
      rowY += rowH;
    };

    addSlider('MUSIC VOLUME', 'musicVolume', settings.musicVolume);
    addSlider('SFX VOLUME', 'sfxVolume', settings.sfxVolume);
    addToggle('MUTE ALL', 'muted', settings.muted);
    addToggle('REDUCED MOTION', 'reducedMotion', settings.reducedMotion);
    addToggle('HAPTIC FEEDBACK', 'haptics', settings.haptics);

    // Reset progress
    const resetBtn = this.add.text(WIDTH / 2, py + panelH - 50, 'RESET PROGRESS', {
      fontFamily: '"Orbitron", monospace', fontSize: '14px', fill: '#ff0000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(72).setInteractive({ useHandCursor: true });
    
    resetBtn.on('pointerup', () => {
      if (window.confirm("Are you sure you want to reset all your progress, coins, and high scores? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
      }
    });

    // Close button
    const closeBtn = this.add.text(WIDTH / 2, py + panelH - 20, '✕ CLOSE', {
      fontFamily: '"Orbitron", monospace', fontSize: '12px', fill: '#ffffff88',
    }).setOrigin(0.5).setDepth(72).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => {
      this.scene.resume('MenuScene');
      this.scene.stop();
    });
  }
}
