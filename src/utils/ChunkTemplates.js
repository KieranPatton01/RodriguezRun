// =============================================================
// ChunkTemplates.js — Pre-designed chunk patterns
// Each chunk defines obstacle/coin/powerup layouts relative
// to the chunk start X. Chunks are 900px wide by default.
// Lane 0=left 1=center 2=right. Y positions are ground-relative.
// =============================================================

import { pick, randomInt } from './MathUtils.js';

// Coin arc helper — returns an arc of coins in a lane
const coinArc = (lane, startX, count, spacing = 60) =>
  Array.from({ length: count }, (_, i) => ({
    type: 'coin', lane, x: startX + i * spacing, y: 0,
  }));

// Elevated coins (jump arc)
const coinJumpArc = (lane, startX, count) =>
  Array.from({ length: count }, (_, i) => ({
    type: 'coin', lane, x: startX + i * 55, y: 120,
  }));

export const CHUNK_TEMPLATES = [
  // ── T1 Chunks (beginner) ──────────────────────────────
  {
    id: 'easy_single_c',
    tier: 1,
    weight: 10,
    objects: [
      { type: 'obstacle', key: 'terrace', lane: 1, x: 200 },
      ...coinArc(0, 50, 5),
      ...coinArc(2, 50, 5),
    ],
  },
  {
    id: 'easy_single_l',
    tier: 1,
    weight: 10,
    objects: [
      { type: 'obstacle', key: 'terrace', lane: 0, x: 200 },
      ...coinArc(1, 50, 5),
      ...coinArc(2, 50, 5),
    ],
  },
  {
    id: 'easy_single_r',
    tier: 1,
    weight: 10,
    objects: [
      { type: 'obstacle', key: 'terrace', lane: 2, x: 200 },
      ...coinArc(0, 50, 5),
      ...coinArc(1, 50, 5),
    ],
  },
  {
    id: 'easy_gap_coins',
    tier: 1,
    weight: 5,
    objects: [
      { type: 'obstacle', key: 'fountain', lane: 0, x: 150 },
      { type: 'obstacle', key: 'olive_tree', lane: 2, x: 150 },
      ...coinArc(1, 50, 7),
    ],
  },
  {
    id: 'easy_jump_row',
    tier: 1,
    weight: 5,
    objects: [
      { type: 'obstacle', key: 'fountain',   lane: 0, x: 200 },
      { type: 'obstacle', key: 'olive_tree', lane: 1, x: 200 },
      { type: 'obstacle', key: 'churro_cart', lane: 2, x: 200 },
      ...coinJumpArc(1, 100, 6),
    ],
  },
  {
    id: 'easy_food_cart_c',
    tier: 1,
    weight: 10,
    objects: [
      { type: 'obstacle', key: 'churro_cart', lane: 1, x: 300 },
      ...coinArc(0, 100, 4),
      ...coinArc(2, 100, 4),
    ],
  },
  {
    id: 'easy_food_cart_l',
    tier: 1,
    weight: 10,
    objects: [
      { type: 'obstacle', key: 'churro_cart', lane: 0, x: 300 },
      ...coinArc(1, 100, 4),
      ...coinArc(2, 100, 4),
    ],
  },
  {
    id: 'easy_food_cart_r',
    tier: 1,
    weight: 10,
    objects: [
      { type: 'obstacle', key: 'churro_cart', lane: 2, x: 300 },
      ...coinArc(0, 100, 4),
      ...coinArc(1, 100, 4),
    ],
  },
  {
    id: 'easy_ramp',
    tier: 1,
    weight: 3, // Reduced weight to lower spawn rate
    objects: [
      { type: 'obstacle', key: 'stairs', lane: 1, x: 100 },
      { type: 'obstacle', key: 'tranvia', lane: 1, x: 500 },
      ...coinJumpArc(1, 200, 4),
      ...coinJumpArc(1, 600, 4),
    ],
  },
  // ── T2 Chunks ─────────────────────────────────────────
  {
    id: 'mid_bicycle_slalom',
    tier: 2,
    weight: 15,
    objects: [
      { type: 'obstacle', key: 'vespa', lane: 0, x: 100 },
      { type: 'obstacle', key: 'vespa', lane: 2, x: 280 },
      { type: 'obstacle', key: 'vespa', lane: 0, x: 460 },
      ...coinArc(1, 50, 6),
    ],
  },
  {
    id: 'mid_performer',
    tier: 2,
    weight: 15,
    objects: [
      { type: 'obstacle', key: 'flamenco', lane: 1, x: 200 },
      { type: 'obstacle', key: 'olive_tree',   lane: 0, x: 400 },
      ...coinArc(2, 100, 5),
      ...coinJumpArc(1, 50, 4),
    ],
  },
  {
    id: 'mid_robot_run',
    tier: 2,
    weight: 15,
    objects: [
      { type: 'obstacle', key: 'bull', lane: 0, x: 150 },
      { type: 'obstacle', key: 'bull', lane: 2, x: 350 },
      { type: 'obstacle', key: 'bull', lane: 1, x: 550 },
      ...coinArc(2, 400, 4),
    ],
  },
  {
    id: 'mid_barrier_row_gap',
    tier: 2,
    weight: 15,
    objects: [
      { type: 'obstacle', key: 'terrace', lane: 0, x: 200 },
      { type: 'obstacle', key: 'terrace', lane: 1, x: 200 },
      // lane 2 is clear — player must switch right
      ...coinArc(2, 50, 8),
      { type: 'powerup', key: 'random', lane: 2, x: 600 },
    ],
  },
  {
    id: 'mid_ramp_to_tram',
    tier: 2,
    weight: 3, // Reduced weight to lower spawn rate
    objects: [
      { type: 'obstacle', key: 'stairs', lane: 1, x: 100 },
      { type: 'obstacle', key: 'tranvia', lane: 1, x: 500 }, // Immediately follows the ramp (ramp depth is 400)
      ...coinJumpArc(1, 150, 4), // Over the ramp
      ...coinJumpArc(1, 550, 6), // On top of the tram
      { type: 'obstacle', key: 'terrace', lane: 0, x: 300 },
      { type: 'obstacle', key: 'terrace', lane: 2, x: 300 },
    ],
  },
  // ── T3 Chunks (moving hazards) ────────────────────────
  {
    id: 'hard_drone_dodge',
    tier: 3,
    weight: 6,
    objects: [
      { type: 'obstacle', key: 'pigeons', lane: 1, x: 200, moving: true, amplitude: 80, speed: 1.5 },
      { type: 'obstacle', key: 'terrace', lane: 0, x: 400 },
      ...coinArc(2, 100, 6),
      { type: 'gem', lane: 1, x: 700 },
    ],
  },
  {
    id: 'hard_tram_crossing',
    tier: 3,
    weight: 5,
    objects: [
      { type: 'obstacle', key: 'tranvia', lane: 0, x: 100, moving: true, amplitude: 0, speed: 0 },
      { type: 'obstacle', key: 'tranvia', lane: 2, x: 500, moving: true, amplitude: 0, speed: 0 },
      ...coinArc(1, 50, 8),
      ...coinJumpArc(0, 250, 3),
    ],
  },
  {
    id: 'hard_mixed_chaos',
    tier: 3,
    weight: 4,
    objects: [
      { type: 'obstacle', key: 'bull',     lane: 0, x: 100 },
      { type: 'obstacle', key: 'flamenco', lane: 2, x: 100 },
      { type: 'obstacle', key: 'pigeons',     lane: 1, x: 350, moving: true, amplitude: 60, speed: 2 },
      { type: 'obstacle', key: 'terrace',   lane: 0, x: 550 },
      ...coinArc(2, 300, 4),
      { type: 'gem', lane: 2, x: 700 },
    ],
  },
  // ── T4 Chunks (dense) ─────────────────────────────────
  {
    id: 'expert_weave',
    tier: 4,
    weight: 4,
    objects: [
      { type: 'obstacle', key: 'vespa',  lane: 1, x: 80  },
      { type: 'obstacle', key: 'terrace',  lane: 0, x: 200 },
      { type: 'obstacle', key: 'bull',    lane: 2, x: 320 },
      { type: 'obstacle', key: 'pigeons',    lane: 1, x: 450, moving: true, amplitude: 70, speed: 2.5 },
      { type: 'obstacle', key: 'olive_tree',  lane: 0, x: 580 },
      ...coinArc(2, 100, 5),
      { type: 'powerup', key: 'random', lane: 2, x: 750 },
    ],
  },
  {
    id: 'expert_jump_gauntlet',
    tier: 4,
    weight: 3,
    objects: [
      { type: 'obstacle', key: 'fountain',   lane: 0, x: 100 },
      { type: 'obstacle', key: 'fountain',   lane: 1, x: 100 },
      { type: 'obstacle', key: 'fountain',   lane: 2, x: 100 },
      { type: 'obstacle', key: 'terrace', lane: 0, x: 350 },
      { type: 'obstacle', key: 'terrace', lane: 1, x: 350 },
      { type: 'obstacle', key: 'terrace', lane: 2, x: 350 },
      ...coinJumpArc(1, 50, 7),
      ...coinJumpArc(1, 300, 5),
    ],
  },
  // ── T5 Chunks (max difficulty) ────────────────────────
  {
    id: 'max_density',
    tier: 5,
    weight: 3,
    objects: [
      { type: 'obstacle', key: 'tranvia',      lane: 0, x: 50,  moving: true, amplitude: 0, speed: 0 },
      { type: 'obstacle', key: 'pigeons',     lane: 1, x: 200, moving: true, amplitude: 90, speed: 3 },
      { type: 'obstacle', key: 'bull',     lane: 2, x: 350 },
      { type: 'obstacle', key: 'flamenco', lane: 0, x: 500 },
      { type: 'obstacle', key: 'pigeons',     lane: 2, x: 650, moving: true, amplitude: 90, speed: 3 },
      { type: 'gem', lane: 1, x: 750 },
      { type: 'powerup', key: 'shield', lane: 1, x: 800 },
    ],
  },
  // ── Open / breather chunks ────────────────────────────
  {
    id: 'breather_coins',
    tier: 1,
    weight: 12,
    objects: [
      ...coinArc(0, 50, 6),
      ...coinArc(1, 50, 6),
      ...coinArc(2, 50, 6),
    ],
  },
  {
    id: 'breather_powerup',
    tier: 1,
    weight: 5,
    objects: [
      { type: 'powerup', key: 'random', lane: 1, x: 400 },
      ...coinArc(0, 100, 4),
      ...coinArc(2, 100, 4),
    ],
  },
];

/** Filter templates available for a given difficulty tier */
export const getChunksForTier = (tier) =>
  CHUNK_TEMPLATES.filter(t => t.tier <= tier);

/** Weighted-random chunk selection for a tier */
export const pickChunk = (tier) => {
  const available = getChunksForTier(tier);
  const total = available.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const chunk of available) {
    r -= chunk.weight;
    if (r <= 0) return chunk;
  }
  return available[available.length - 1];
};
