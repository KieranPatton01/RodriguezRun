// =============================================================
// MathUtils.js — Pure math helpers
// =============================================================

/** Linear interpolation */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp value between min and max */
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Random float between min and max */
export const randomRange = (min, max) => Math.random() * (max - min) + min;

/** Random integer between min (inclusive) and max (inclusive) */
export const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));

/** Weighted random selection from array of {item, weight} */
export const weightedRandom = (items) => {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
};

/** Smooth step (ease in-out) */
export const smoothStep = (t) => t * t * (3 - 2 * t);

/** Map a value from one range to another */
export const mapRange = (v, a1, a2, b1, b2) =>
  b1 + ((v - a1) / (a2 - a1)) * (b2 - b1);

/** Clamp-mapped range */
export const mapRangeClamped = (v, a1, a2, b1, b2) =>
  clamp(mapRange(v, a1, a2, b1, b2), Math.min(b1, b2), Math.max(b1, b2));

/** Shuffle array in-place (Fisher-Yates) */
export const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Pick one element at random */
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Distance between two points */
export const dist = (x1, y1, x2, y2) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
