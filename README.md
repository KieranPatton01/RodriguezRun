# RodriguezRun — Neo-Citadel Chronicles

A production-quality **endless runner** set in Neo-Citadel, a futuristic European-inspired city. Play as **Mira**, an urban courier sprinting through neon-lit streets, baroque plazas, and tram corridors.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Phaser 3** | Game engine (WebGL/Canvas) |
| **Vite** | Build tool & dev server |
| **Vanilla JS (ES6)** | No framework overhead |
| **vite-plugin-pwa** | PWA manifest & service worker |

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build for Production

```bash
npm run build
npm run preview  # Test the production build locally
```

## Project Structure

```
/src
  /scenes          — BootScene, PreloadScene, MenuScene, GameScene, GameOverScene, SettingsScene, StatsScene
  /entities        — Player, Obstacle (9 types), Coin, PowerUp (6 types), Gem
  /managers        — SpawnManager, ScoreManager, DifficultyManager, WorldManager, CameraManager, ParticleManager, AudioManager, InputManager, SaveManager
  /ui              — HUD, Buttons, FloatingText, AchievementPopup, Transitions
  /utils           — EventBus, ObjectPool, MathUtils, ChunkTemplates
  config.js        — Single source of truth for all game constants
  main.js          — Phaser game entry point
/public
  sw.js            — Service worker (manual fallback)
  generate-icons.js — Node script to generate PWA icons
  /icons           — PWA icon set (72–512px)
```

## Gameplay Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move Left | `←` / `A` | Swipe Left |
| Move Right | `→` / `D` | Swipe Right |
| Jump | `↑` / `W` / `Space` | Swipe Up / Tap |
| Slide | `↓` / `S` | Swipe Down |
| Pause | `Esc` | Pause button (HUD) |

## Architecture

### Event Bus
All inter-system communication uses the singleton `EventBus` (`src/utils/EventBus.js`). No direct manager-to-manager references. Key events:
- `input:jump`, `input:slide`, `input:left`, `input:right`
- `coin:collected`, `gem:collected`
- `powerup:collected`, `powerup:start`, `powerup:end`
- `player:stumble`, `player:death`
- `score:update`, `score:comboUp`, `score:comboBreak`
- `camera:shake`, `camera:hitStop`, `camera:flash`
- `particle:coinBurst`, `particle:gemBurst`, `particle:explosion`
- `achievement:unlock`
- `difficulty:tierChange`

### Object Pooling
All `Obstacle`, `Coin`, `PowerUp`, and `Gem` instances are managed by `ObjectPool` — no new allocations during gameplay.

### Procedural Generation
`ChunkTemplates.js` defines 17 hand-crafted chunk patterns across 5 difficulty tiers. `SpawnManager` selects chunks using weighted-random selection based on the current difficulty tier.

### Difficulty Curve
Speed ramps smoothly from 350px/s → 750px/s over 3 minutes using `mapRangeClamped`. Obstacle complexity and density increase through 5 tiers with moving hazards unlocking at Tier 3.

## PWA Features

- ✅ Installable on iOS and Android
- ✅ Offline play (service worker caches all assets)
- ✅ Custom icons (72–512px)
- ✅ Splash screen
- ✅ Portrait orientation lock
- ✅ Full-screen standalone mode

## Performance Notes

- **60 FPS target** on modern mobile devices
- All entities use **object pooling** (zero GC pressure during gameplay)
- All graphics are **programmatic** (no external image assets to load)
- Web Audio API used for SFX (no audio file loading)
- **Delta-time movement** ensures consistent speed at any frame rate

## Generating PWA Icons

If you have the `canvas` npm package installed:

```bash
npm install canvas
node public/generate-icons.js
```

Alternatively, place your own 512x512 PNG at `public/icons/icon-512.png` and let Vite PWA handle the rest.

## License

MIT — Original characters, environments, and assets. Not affiliated with any existing game franchise.
