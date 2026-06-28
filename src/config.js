// =============================================================
// config.js — Central game configuration
// All tunable constants live here. No magic numbers in game code.
// =============================================================

export const CONFIG = {
  // ── Game dimensions ──────────────────────────────────────
  WIDTH: 480,
  HEIGHT: 854,

  // ── Lane system (3D World Space) ─────────────────────────
  LANES: {
    COUNT: 3,
    // World X positions for left / center / right lanes
    POSITIONS: [-140, 0, 140],
    SWITCH_DURATION: 160, // ms for lane transition
  },

  // ── Player (3D World Space) ──────────────────────────────
  PLAYER: {
    START_LANE: 1,            // 0=left, 1=center, 2=right
    GROUND_Y: 0,              // Z-plane altitude (0 = ground level)
    JUMP_VELOCITY: 800,       // Upwards Y velocity in 3D
    GRAVITY: 2200,
    INVINCIBLE_DURATION: 2000,// ms after hit
    TRAIL_ALPHA: 0.4,
    // Hitbox sizes per state [width, height, offsetX, offsetY]
    HITBOX: {
      run:   [36, 80,  0,   0],
      jump:  [36, 80,  0,   0],
    },
  },

  // ── World / Scrolling (Z-axis) ───────────────────────────
  WORLD: {
    INITIAL_SPEED: 1800,      // units/s along Z axis
    MAX_SPEED: 3500,          // units/s
    SPEED_RAMP_DURATION: 180, // seconds to reach max speed
    CHUNK_LENGTH: 2000,       // Z units per chunk
    DESPAWN_Z: -200,          // objects despawn behind camera
    SPAWN_Z: 4000,            // objects spawn at horizon
  },

  // ── Difficulty tiers ─────────────────────────────────────
  DIFFICULTY: {
    TIER_1: { timeStart: 0,    speed: 350, density: 1.5, moving: false },
    TIER_2: { timeStart: 30,   speed: 400, density: 1.8, moving: false },
    TIER_3: { timeStart: 75,   speed: 460, density: 2.2,  moving: true  },
    TIER_4: { timeStart: 150,  speed: 530, density: 2.6,  moving: true  },
    TIER_5: { timeStart: 250,  speed: 620, density: 3.0,  moving: true  },
  },

  // ── Scoring ──────────────────────────────────────────────
  SCORE: {
    DISTANCE_PER_METER: 1,
    COIN_VALUE: 10,
    GEM_VALUE: 100,
    COMBO_RESET_TIME: 3500,   // ms without coin before combo resets
    COMBO_THRESHOLDS: [5, 15, 30, 60], // coins needed for x2/x3/x5/x10
    COMBO_MULTIPLIERS: [2, 3, 5, 10],
  },

  // ── Spawn rates (seconds between spawns per tier) ────────
  SPAWN: {
    OBSTACLE_MIN: 1.2,
    OBSTACLE_MAX: 2.5,
    COIN_MIN: 0.8,
    COIN_MAX: 1.6,
    POWERUP_CHANCE: 0.04,     // per chunk
    GEM_CHANCE: 0.02,
  },

  // ── Powerup durations (ms) ───────────────────────────────
  POWERUP: {
    MAGNET: 8000,
    DOUBLE_SCORE: 10000,
    SHIELD: 1,               // 1 hit
    SLOW_MOTION: 5000,
    SPEED_BOOST: 6000,
    HOVERBOARD: 12000,
    MAGNET_RADIUS: 200,
    SLOW_FACTOR: 0.5,
    SPEED_FACTOR: 1.4,
  },

  // ── Physics ──────────────────────────────────────────────
  PHYSICS: {
    GRAVITY_Y: 2200,
  },

  // ── Audio ────────────────────────────────────────────────
  AUDIO: {
    MUSIC_VOLUME: 0.45,
    SFX_VOLUME: 0.7,
    FADE_DURATION: 500,
  },

  // ── Camera / Pseudo-3D ───────────────────────────────────
  CAMERA: {
    FOV: 400,                 // Field of view (lower = more distorted)
    HEIGHT: 180,              // Vertical altitude from ground
    Z: -200,                  // Camera offset from player
    SHAKE_INTENSITY: 0.008,
    SHAKE_DURATION: 300,
    HIT_STOP_DURATION: 60,   // ms
  },

  // ── Visual style ─────────────────────────────────────────
  COLORS: {
    SKY_TOP: 0x2980b9,        // Azure bright blue (Madrid sky)
    SKY_BOTTOM: 0x87ceeb,     // Lighter blue horizon
    GROUND: 0xcda077,         // Sand/terracotta cobblestone
    GROUND_LINE: 0x8b5a2b,    // Darker stone lines
    NEON_CYAN: 0xe74c3c,      // Flamenco red
    NEON_MAGENTA: 0xd35400,   // Terracotta orange
    NEON_AMBER: 0xf1c40f,     // Spanish gold
    NEON_GREEN: 0x27ae60,     // Olive green
    PLAYER_BODY: 0xc0392b,    // Red dress
    PLAYER_VISOR: 0x5c4033,   // Brown hair (used differently now)
    COIN: 0xf1c40f,           // Euro gold
    GEM: 0x9b59b6,            // Purple amethyst
    UI_BG: 0x2c3e50,          // Dark slate
    UI_PANEL: 0x34495e,       // Medium slate
    UI_TEXT: 0xecf0f1,        // Off-white
    UI_ACCENT: 0xe74c3c,      // Red accent
  },

  // ── Parallax layers ──────────────────────────────────────
  PARALLAX: {
    FAR_SPEED: 0.15,   // fraction of world speed
    MID_SPEED: 0.40,
    NEAR_SPEED: 0.75,
    GROUND_SPEED: 1.0,
  },

  // ── Day/Night cycle ──────────────────────────────────────
  DAYCYCLE: {
    DURATION: 90,      // seconds per full cycle
    PHASES: ['dawn', 'day', 'dusk', 'night'],
  },

  // ── Weather ──────────────────────────────────────────────
  WEATHER: {
    CHANGE_INTERVAL: 45,  // seconds
    TYPES: ['clear', 'clear', 'clear', 'rain', 'fog'],
    RAIN_PARTICLES: 120,
  },

  // ── LocalStorage keys ────────────────────────────────────
  STORAGE: {
    KEY: 'rodrigezrun_save',
    VERSION: 1,
  },
};

// Obstacle type definitions (Madrid Theme)
export const OBSTACLE_TYPES = {
  TERRACE:     { key: 'terrace',     w: 54, h: 68, d: 50, lanes: [0,1,2], tier: 1, moving: false },
  FOUNTAIN:    { key: 'fountain',    w: 60, h: 50, d: 60, lanes: [0,1,2], tier: 1, moving: false },
  OLIVE_TREE:  { key: 'olive_tree',  w: 48, h: 60, d: 48, lanes: [0,1,2], tier: 1, moving: false },
  CHURRO_CART: { key: 'churro_cart', w: 60, h: 70, d: 80, lanes: [0,1,2], tier: 1, moving: false },
  VESPA:       { key: 'vespa',       w: 40, h: 56, d: 80, lanes: [0,1,2], tier: 2, moving: false },
  FLAMENCO:    { key: 'flamenco',    w: 46, h: 70, d: 46, lanes: [0,1,2], tier: 2, moving: false },
  BULL:        { key: 'bull',        w: 48, h: 66, d: 48, lanes: [0,1,2], tier: 2, moving: false },
  PIGEONS:     { key: 'pigeons',     w: 60, h: 30, d: 60, lanes: [0,1,2], tier: 3, moving: true  },
  TRANVIA:     { key: 'tranvia',     w: 80, h: 120, d: 800, lanes: [0,2],   tier: 3, moving: true, surface: true },
  STAIRS:      { key: 'stairs',      w: 80, h: 120, d: 400, lanes: [0,1,2], tier: 2, moving: false, ramp: true },
};

export const POWERUP_TYPES = {
  MAGNET:      { key: 'pu_magnet',      color: 0xff6b35, label: 'MAGNET'    },
  DOUBLE:      { key: 'pu_double',      color: 0xffbe0b, label: '2×SCORE'   },
  SHIELD:      { key: 'pu_shield',      color: 0x00d4ff, label: 'SHIELD'    },
  SLOW:        { key: 'pu_slow',        color: 0x8338ec, label: 'SLOW-MO'   },
  SPEED:       { key: 'pu_speed',       color: 0xff006e, label: 'TURBO'     },
  HOVERBOARD:  { key: 'pu_hoverboard',  color: 0x06d6a0, label: 'HOVERBOARD'},
};
