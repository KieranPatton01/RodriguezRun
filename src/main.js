// =============================================================
// main.js — Phaser 3 game entry point
// Configures and boots the game instance
// =============================================================

import './style.css';
import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { StatsScene } from './scenes/StatsScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { CheatsScene } from './scenes/CheatsScene.js';

// ── Responsive scale calculation ─────────────────────────────
const getScale = () => {
  const ratio = CONFIG.WIDTH / CONFIG.HEIGHT;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const screenRatio = screenW / screenH;

  if (screenRatio > ratio) {
    return { width: Math.floor(screenH * ratio), height: screenH };
  } else {
    return { width: screenW, height: Math.floor(screenW / ratio) };
  }
};

// ── Phaser game configuration ────────────────────────────────
const gameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#0d1b2a',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // We handle gravity manually in Player
      debug: false,
    },
  },
  render: {
    antialias: true,
    roundPixels: false,
    pixelArt: false,
    powerPreference: 'high-performance',
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    GameOverScene,
    SettingsScene,
    StatsScene,
    TutorialScene,
    CheatsScene,
  ],
};

// ── Boot the game ─────────────────────────────────────────────
const game = new Phaser.Game(gameConfig);

// ── Resize handler ────────────────────────────────────────────
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// ── Prevent context menu on right-click (mobile) ─────────────
window.addEventListener('contextmenu', (e) => e.preventDefault());

// ── Prevent scroll bounce on iOS ─────────────────────────────
document.addEventListener('touchmove', (e) => {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
}, { passive: false });

// ── PWA Installation Prompt ──────────────────────────────────
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;

  // Only show the install prompt if we're on a mobile device (Android)
  const isMobile = /Android|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    showInstallPrompt(false);
  }
});

// Check for iOS since it doesn't fire beforeinstallprompt
window.addEventListener('load', () => {
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
  // window.navigator.standalone is Safari-specific. display-mode handles others.
  const isStandalone = ('standalone' in window.navigator) && window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const hasDismissedIosPrompt = localStorage.getItem('ios_pwa_dismissed') === 'true';
  
  if (isIos && !isStandalone && !hasDismissedIosPrompt) {
    // Slight delay to not interrupt loading immediately
    setTimeout(() => {
      showInstallPrompt(true);
    }, 2000);
  }
});

function showInstallPrompt(isIos) {
  // Don't show if already added
  if (document.getElementById('pwa-install-prompt')) return;

  const promptDiv = document.createElement('div');
  promptDiv.id = 'pwa-install-prompt';
  promptDiv.style.position = 'absolute';
  promptDiv.style.bottom = '20px';
  promptDiv.style.left = '50%';
  promptDiv.style.transform = 'translateX(-50%)';
  promptDiv.style.backgroundColor = 'rgba(13, 27, 42, 0.95)';
  promptDiv.style.color = '#fff';
  promptDiv.style.padding = '15px 20px';
  promptDiv.style.borderRadius = '12px';
  promptDiv.style.boxShadow = '0 4px 15px rgba(0,212,255,0.4)';
  promptDiv.style.display = 'flex';
  promptDiv.style.flexDirection = 'column';
  promptDiv.style.alignItems = 'center';
  promptDiv.style.zIndex = '999999';
  promptDiv.style.fontFamily = '"Orbitron", monospace';
  promptDiv.style.border = '2px solid #00d4ff';
  promptDiv.style.width = '80%';
  promptDiv.style.maxWidth = '300px';
  
  const text = document.createElement('p');
  if (isIos) {
    text.innerHTML = 'To install the app on iOS:<br><br>Tap the <b>Share</b> icon below, then select <b>"Add to Home Screen"</b>.';
  } else {
    text.innerText = 'Install Rodriguez Run as an app for full screen and better performance!';
  }
  text.style.margin = '0 0 15px 0';
  text.style.fontSize = '12px';
  text.style.lineHeight = '1.4';
  text.style.textAlign = 'center';

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '15px';

  const cancelBtn = document.createElement('button');
  cancelBtn.innerText = isIos ? 'GOT IT' : 'LATER';
  cancelBtn.style.padding = '8px 16px';
  cancelBtn.style.backgroundColor = '#ff006e';
  cancelBtn.style.color = '#fff';
  cancelBtn.style.border = 'none';
  cancelBtn.style.borderRadius = '4px';
  cancelBtn.style.fontWeight = 'bold';
  cancelBtn.style.cursor = 'pointer';

  cancelBtn.addEventListener('click', () => {
    if (isIos) localStorage.setItem('ios_pwa_dismissed', 'true');
    promptDiv.remove();
  });

  btnContainer.appendChild(cancelBtn);

  if (!isIos) {
    const installBtn = document.createElement('button');
    installBtn.innerText = 'INSTALL';
    installBtn.style.padding = '8px 16px';
    installBtn.style.backgroundColor = '#00d4ff';
    installBtn.style.color = '#0d1b2a';
    installBtn.style.border = 'none';
    installBtn.style.borderRadius = '4px';
    installBtn.style.fontWeight = 'bold';
    installBtn.style.cursor = 'pointer';

    installBtn.addEventListener('click', async () => {
      promptDiv.remove();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
      }
    });
    btnContainer.appendChild(installBtn);
  }

  promptDiv.appendChild(text);
  promptDiv.appendChild(btnContainer);
  
  document.body.appendChild(promptDiv);
}

window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  const promptDiv = document.getElementById('pwa-install-prompt');
  if (promptDiv) promptDiv.remove();
});

export default game;
