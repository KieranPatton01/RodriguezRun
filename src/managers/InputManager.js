// =============================================================
// InputManager.js — Unified keyboard + touch/swipe input
// =============================================================

import Phaser from 'phaser';
import { bus } from '../utils/EventBus.js';

const SWIPE_THRESHOLD = 40; // px min swipe distance
const SWIPE_TIMEOUT = 400;  // ms max swipe duration

export class InputManager {
  constructor(scene) {
    this._scene = scene;
    this._keys = {};
    this._touchStart = null;
    this._touchStartTime = 0;
    this._enabled = true;

    this._setupKeyboard();
    this._setupTouch();
  }

  _setupKeyboard() {
    const kb = this._scene.input.keyboard;
    this._keys = {
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      a:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      esc:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };

    this._keys.left.on('down',  () => this._emit('left'));
    this._keys.a.on('down',     () => this._emit('left'));
    this._keys.right.on('down', () => this._emit('right'));
    this._keys.d.on('down',     () => this._emit('right'));
    this._keys.up.on('down',    () => this._emit('jump'));
    this._keys.w.on('down',     () => this._emit('jump'));
    this._keys.space.on('down', () => this._emit('jump'));
    this._keys.esc.on('down',   () => bus.emit('input:pause'));
  }

  _setupTouch() {
    const input = this._scene.input;
    input.on('pointerdown', (p) => {
      this._touchStart = { x: p.x, y: p.y };
      this._touchStartTime = Date.now();
    });
    input.on('pointerup', (p) => {
      if (!this._touchStart) return;
      const dx = p.x - this._touchStart.x;
      const dy = p.y - this._touchStart.y;
      const dt = Date.now() - this._touchStartTime;
      this._touchStart = null;

      if (dt > SWIPE_TIMEOUT) return; // too slow
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < SWIPE_THRESHOLD && ady < SWIPE_THRESHOLD) {
        // Tap — treated as jump
        this._emit('jump');
        return;
      }
      if (adx > ady) {
        this._emit(dx > 0 ? 'right' : 'left');
      } else {
        // Removed slide. Treat downward swipe as nothing (or just ignore)
        if (dy < 0) {
          this._emit('jump');
        }
      }
    });
  }

  _emit(action) {
    if (!this._enabled) return;
    bus.emit(`input:${action}`);
  }

  enable()  { this._enabled = true; }
  disable() { this._enabled = false; }

  destroy() {
    this._scene.input.keyboard.removeAllListeners();
    this._scene.input.removeAllListeners();
  }
}
