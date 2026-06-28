const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = i * Math.PI / 3 - Math.PI / 6;
    return (cx + r * Math.cos(angle)).toFixed(1) + ',' + (cy + r * Math.sin(angle)).toFixed(1);
  }).join(' ');
}

sizes.forEach(s => {
  const cx = s / 2, cy = s / 2;
  const r = s * 0.42;
  const sw = (s * 0.025).toFixed(1);
  const fs2 = Math.round(s * 0.46);
  const ty = (s * 0.575).toFixed(1);
  const dotCx = (cx + s * 0.22).toFixed(1);
  const dotCy = (cy - s * 0.28).toFixed(1);
  const dotR = (s * 0.04).toFixed(1);
  const pts = hexPoints(cx, cy, r);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">`,
    `  <rect width="${s}" height="${s}" fill="#0d1b2a"/>`,
    `  <polygon points="${pts}" fill="#00d4ff" fill-opacity="0.15"/>`,
    `  <polygon points="${pts}" fill="none" stroke="#00d4ff" stroke-width="${sw}"/>`,
    `  <text x="${cx}" y="${ty}" font-family="Arial,sans-serif" font-weight="bold" font-size="${fs2}" fill="#ff6b35" text-anchor="middle">R</text>`,
    `  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="#00d4ff"/>`,
    `</svg>`
  ].join('\n');

  const svgPath = path.join(dir, `icon-${s}.svg`);
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log(`Generated ${svgPath}`);
});

console.log('All SVG icons generated. For PNG conversion, open icons/convert.html in a browser.');

// Also write a simple browser-based converter
const convertHtml = `<!DOCTYPE html>
<html>
<head><title>Icon Converter</title></head>
<body>
<script>
const sizes = [72,96,128,144,152,192,384,512];
sizes.forEach(s => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    c.getContext('2d').drawImage(img, 0, 0, s, s);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'icon-' + s + '.png';
    a.textContent = 'Download icon-' + s + '.png';
    a.style.display = 'block';
    document.body.appendChild(a);
  };
  img.src = 'icon-' + s + '.svg';
});
<\/script>
</body>
</html>`;
fs.writeFileSync(path.join(dir, 'convert.html'), convertHtml, 'utf8');
