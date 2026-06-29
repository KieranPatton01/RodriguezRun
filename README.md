# Rodriguez Run — Sara's Safestay Adventure

A production-quality **endless runner** set in Madrid. Play as **Sara**, sprinting through the streets, dodging obstacles like trams and drones, and collecting Euros to unlock new characters like Stinky Sara, Fiancée Fernandez, and Abid!

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

Open `http://localhost:5173` in your browser.

## Build for Production & Deploy

```bash
npm run build
npm run preview  # Test the production build locally
```

To deploy to GitHub Pages:
```bash
npm run deploy
```

## Project Structure

```
/src
  /scenes          — BootScene, PreloadScene, MenuScene, GameScene, GameOverScene, SettingsScene, StatsScene
  /entities        — Player, Obstacle, Coin, PowerUp, Gem
  /managers        — SpawnManager, ScoreManager, DifficultyManager, WorldManager, CameraManager, ParticleManager, AudioManager, InputManager, SaveManager
  /ui              — HUD, Buttons, FloatingText, AchievementPopup, Transitions
  /utils           — EventBus, ObjectPool, MathUtils, ChunkTemplates
  config.js        — Single source of truth for all game constants
  main.js          — Phaser game entry point
/public
  /icons           — PWA icon set (generated via RedKetchup)
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
`ChunkTemplates.js` defines hand-crafted chunk patterns across 5 difficulty tiers. `SpawnManager` selects chunks using weighted-random selection based on the current difficulty tier.

### Difficulty Curve
Speed ramps smoothly and obstacle complexity increases through 5 tiers with moving hazards unlocking at Tier 3.

## PWA Features

- ✅ Installable on iOS (via Share menu) and Android (via automatic prompt)
- ✅ Desktop QR Code Prompt to encourage mobile downloads
- ✅ Offline play (service worker caches all assets)
- ✅ Custom icons (16–512px)
- ✅ Splash screen
- ✅ Portrait orientation lock
- ✅ Full-screen standalone mode

## Performance Notes

- **60 FPS target** on modern mobile devices
- All entities use **object pooling** (zero GC pressure during gameplay)
- Graphics are heavily **programmatic**
- Web Audio API used for SFX (no audio file loading)
- **Delta-time movement** ensures consistent speed at any frame rate

## Updating PWA Icons

Icons are generated using [RedKetchup.io Favicon Generator](https://redketchup.io/favicon-generator). 
To update the icons, generate a new set, download the zip, and extract the PNG files into the `public/icons/` folder. Ensure `vite.config.js` and `index.html` point to the correct filenames.

## License

MIT — Original characters, environments, and assets. Not affiliated with any existing game franchise.
