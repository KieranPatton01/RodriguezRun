// =============================================================
// FloatingText.js — Pooled floating score/label text
// Rises and fades out above collection point
// =============================================================

import { CONFIG } from '../config.js';
import { ObjectPool } from '../utils/ObjectPool.js';

export class FloatingTextManager {
  constructor(scene) {
    this._scene = scene;
    this._pool = new ObjectPool(
      () => scene.add.text(0, 0, '', {
        font: 'bold 18px "Orbitron", monospace',
        fill: '#ffbe0b',
        shadow: { x: 0, y: 0, color: '#ff6b35', blur: 8, fill: true },
      }).setDepth(55).setAlpha(0),
      (t) => { t.setAlpha(0).setScale(1); },
      10
    );
  }

  /** Show a floating text at world position */
  show(x, y, text, color = '#ffbe0b', size = 18) {
    const t = this._pool.acquire();
    t.setPosition(x, y)
     .setText(text)
     .setAlpha(1)
     .setScale(0.5)
     .setStyle({ fill: color, fontSize: `${size}px` });

    this._scene.tweens.add({
      targets: t,
      y: y - 70,
      scaleX: 1, scaleY: 1,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => this._pool.release(t),
    });
  }

  showCoin(x, y, multiplier = 1) {
    const text = multiplier > 1 ? `+${10 * multiplier} x${multiplier}` : '+10';
    this.show(x, y - 30, text, '#ffbe0b', 14);
  }

  showGem(x, y) {
    this.show(x, y - 40, '+100 ◆GEM!', '#ff006e', 18);
  }

  showPowerup(x, y, label) {
    this.show(x, y - 40, label, '#00d4ff', 16);
  }

  showCombo(x, y, text) {
    this.show(x, y - 60, text, '#ff006e', 22);
  }
}
