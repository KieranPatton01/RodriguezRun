// =============================================================
// generate-icons.js — Run with Node.js to generate PWA icons
// node public/generate-icons.js
// =============================================================
// Note: Run from project root. Requires the 'canvas' npm package:
// npm install canvas (or use the script via Vite dev canvas API)
// In the browser (during BootScene), icons are embedded in manifest.
// =============================================================

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0d1b2a';
  ctx.fillRect(0, 0, size, size);

  // Hexagon shape
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = size * 0.025;
  ctx.stroke();

  // Glow hex (inner)
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#00d4ff';
  ctx.fill();
  ctx.globalAlpha = 1;

  // 'R' letter
  ctx.fillStyle = '#ff6b35';
  ctx.font = `bold ${size * 0.46}px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', cx, cy + size * 0.02);

  // Neon dot accent
  ctx.fillStyle = '#00d4ff';
  ctx.beginPath();
  ctx.arc(cx + size * 0.22, cy - size * 0.28, size * 0.04, 0, Math.PI * 2);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buffer);
  console.log(`Generated icon-${size}.png`);
}

sizes.forEach(generateIcon);
console.log('All icons generated successfully!');
