// =============================================================
// CameraManager.js — Screen shake & hit-stop effects
// Uses trauma-squared system for natural-feeling shake
// =============================================================

import { CONFIG } from '../config.js';
import { lerp } from '../utils/MathUtils.js';
import { bus } from '../utils/EventBus.js';

export class CameraManager {
  constructor(scene) {
    this._scene = scene;
    this._cam = scene.cameras.main;
    this._trauma = 0;         // 0-1, decays over time
    this._hitStopTimer = 0;
    this._flashActive = false;

    bus.on('camera:shake', ({ intensity }) => this.shake(intensity ?? 0.6));
    bus.on('camera:hitStop', () => this.hitStop());
    bus.on('camera:flash', ({ color, duration }) => this.flash(color, duration));
  }

  shake(traumaAmount = 0.5) {
    this._trauma = Math.min(this._trauma + traumaAmount, 1);
  }

  hitStop(duration = CONFIG.CAMERA.HIT_STOP_DURATION) {
    this._hitStopTimer = duration;
    this._scene.physics.pause();
    this._scene.time.delayedCall(duration, () => {
      if (this._scene.physics) this._scene.physics.resume();
    });
  }

  flash(color = 0xffffff, duration = 200) {
    this._cam.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, true);
  }

  update(delta) {
    if (this._trauma > 0) {
      const shakeAmt = this._trauma * this._trauma * CONFIG.CAMERA.SHAKE_INTENSITY;
      this._cam.setAngle((Math.random() * 2 - 1) * shakeAmt * 3);
      this._cam.setScroll(
        (Math.random() * 2 - 1) * shakeAmt * CONFIG.WIDTH,
        (Math.random() * 2 - 1) * shakeAmt * CONFIG.HEIGHT
      );
      this._trauma = Math.max(0, this._trauma - delta / 600);
    } else {
      this._cam.setAngle(0);
      this._cam.setScroll(0, 0);
    }
  }
}
