// =============================================================
// Transitions.js — Scene transition helpers
// =============================================================

import { CONFIG } from '../config.js';

export class Transitions {
  /** Fade-to-black then launch new scene */
  static fadeOut(scene, targetScene, data = {}, duration = 500) {
    scene.cameras.main.fadeOut(duration, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      scene.scene.start(targetScene, data);
    });
  }

  /** Fade in from black on scene start */
  static fadeIn(scene, duration = 400) {
    scene.cameras.main.fadeIn(duration, 0, 0, 0);
  }

  /** Slide panel in from bottom */
  static slideUp(scene, gameObject, fromY, toY, duration = 350, ease = 'Back.easeOut') {
    gameObject.y = fromY;
    return scene.tweens.add({
      targets: gameObject,
      y: toY,
      duration,
      ease,
    });
  }

  /** Bounce-scale entrance animation */
  static popIn(scene, gameObject, delay = 0) {
    gameObject.setScale(0);
    return scene.tweens.add({
      targets: gameObject,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      delay,
      ease: 'Back.easeOut',
    });
  }
}
