// =============================================================
// AchievementPopup.js — Slide-in achievement toast notifications
// Queues multiple achievements and shows them sequentially
// =============================================================

import { CONFIG } from '../config.js';
import { bus } from '../utils/EventBus.js';

export const ACHIEVEMENTS_META = {
  first_run:     { title: 'Off the Mark',     desc: 'Complete your first run',    icon: '🏃' },
  score_1000:    { title: 'Getting Started',  desc: 'Score 1,000 points',         icon: '⭐' },
  score_10000:   { title: 'High Roller',      desc: 'Score 10,000 points',        icon: '🌟' },
  score_50000:   { title: 'Safestay Legend',  desc: 'Score 50,000 points',        icon: '👑' },
  combo_10:      { title: 'Chain Gang',       desc: '10 coin combo',              icon: '🔥' },
  combo_30:      { title: 'Combo Master',     desc: '30 coin combo',              icon: '⚡' },
  distance_500:  { title: 'Madrid Runner',    desc: 'Run 500 meters',             icon: '🏙️' },
  distance_2000: { title: 'Safestay Marathoner',desc: 'Run 2,000 meters',         icon: '🎆' },
  powerup_10:    { title: 'Power User',       desc: 'Collect 10 powerups',        icon: '⚡' },
  shield_save:   { title: 'Close Call',       desc: 'Shield absorbed a hit',      icon: '🛡️' },
  gem_5:         { title: 'Gem Collector',    desc: 'Collect 5 gems',             icon: '💎' },
};

export class AchievementPopup {
  constructor(scene) {
    this._scene = scene;
    this._queue = [];
    this._showing = false;
    this._container = null;

    bus.on('achievement:unlock', ({ id }) => {
      const meta = ACHIEVEMENTS_META[id];
      if (meta) this._enqueue(meta);
    });
  }

  _enqueue(meta) {
    this._queue.push(meta);
    if (!this._showing) this._showNext();
  }

  _showNext() {
    if (this._queue.length === 0) { this._showing = false; return; }
    this._showing = true;
    const meta = this._queue.shift();
    this._show(meta);
  }

  _show(meta) {
    const { WIDTH, HEIGHT } = this._scene.sys.game.canvas;
    const startY = HEIGHT + 80; // slide up from bottom
    const targetY = HEIGHT / 2 - 32; // center screen
    const s = this._scene;

    // Panel
    const panel = s.add.graphics().setDepth(90);
    panel.fillStyle(0x0d1b2a, 0.95);
    panel.fillRoundedRect(WIDTH / 2 - 160, 0, 320, 64, 12);
    panel.lineStyle(2, CONFIG.COLORS.NEON_AMBER, 0.9);
    panel.strokeRoundedRect(WIDTH / 2 - 160, 0, 320, 64, 12);
    panel.y = startY;

    // Icon
    const icon = s.add.text(WIDTH / 2 - 136, 20, meta.icon, {
      font: '28px sans-serif',
    }).setDepth(91).setY(startY + 20);

    // Title
    const title = s.add.text(WIDTH / 2 - 100, 14, `🏆 ${meta.title}`, {
      font: 'bold 13px "Orbitron", monospace',
      fill: '#ffbe0b',
    }).setDepth(91).setY(startY + 14);

    // Desc
    const desc = s.add.text(WIDTH / 2 - 100, 34, meta.desc, {
      font: '11px "Orbitron", monospace',
      fill: '#aaaacc',
    }).setDepth(91).setY(startY + 34);

    const items = [panel, icon, title, desc];

    // Slide in
    s.tweens.add({
      targets: items,
      y: (target) => {
        if (target === panel) return targetY;
        return target.y + (targetY - startY);
      },
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold, then slide out
        s.time.delayedCall(2800, () => {
          s.tweens.add({
            targets: items,
            y: (t) => t.y - (targetY + 80),
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              items.forEach(i => i.destroy());
              s.time.delayedCall(200, () => this._showNext());
            }
          });
        });
      }
    });
  }
}
