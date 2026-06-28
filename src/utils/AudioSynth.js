// =============================================================
// AudioSynth.js — Shared AudioContext for synthesizing tones
// Prevents exhausting hardware audio contexts
// =============================================================

let ctx = null;

export const getAudioContext = () => {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  // If browser suspended it, try to resume
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
};
