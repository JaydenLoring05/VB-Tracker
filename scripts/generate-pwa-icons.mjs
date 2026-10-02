// Generates the PWA icons in public/icons/ from a single vector mark.
// Run manually when the brand mark changes: node scripts/generate-pwa-icons.mjs
// Requires `sharp`, which ships with Next.js (no extra dependency needed).
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import sharp from "sharp";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

// Brand tokens, matching src/styles/tokens.css (--bg, --gold, --on-gold) and
// the offline page.
const BG = "#070503";
const BG_GLOW = "#1a150d";
const GOLD = "#e5ac4c";
const INK = "#140f08";

// The NextRep monogram from src/components/shared/Brand.tsx (MONOGRAM_PATHS),
// in its 32x32 box: a volleyball whose seams form an "N".
const BALL = { cx: 16, cy: 16, r: 11.2 };
const SEAMS =
  "M11.2 7.2 Q8.6 16 11.2 24.8 M20.8 7.2 Q23.4 16 20.8 24.8 M11.2 7.2 C14.6 12.6 17.4 19.4 20.8 24.8";

// ballRatio: the ball's radius as a share of the canvas.
function iconSvg(size, ballRatio) {
  const c = size / 2;
  const stroke = 2.4;
  const scale = (size * ballRatio) / (BALL.r + stroke * 1.4);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="28%" r="78%">
      <stop offset="0" stop-color="${BG_GLOW}"/>
      <stop offset="0.62" stop-color="${BG}"/>
      <stop offset="1" stop-color="#020201"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0.55" stop-color="${GOLD}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <circle cx="${c}" cy="${c}" r="${size * ballRatio * 1.6}" fill="url(#halo)"/>
  <g transform="translate(${c} ${c}) scale(${scale}) translate(${-BALL.cx} ${-BALL.cy})">
    <circle cx="${BALL.cx}" cy="${BALL.cy}" r="${BALL.r + stroke * 1.4}" fill="${GOLD}"/>
    <circle cx="${BALL.cx}" cy="${BALL.cy}" r="${BALL.r}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>
    <path d="${SEAMS}" fill="none" stroke="${INK}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, ball: 0.34 },
  { file: "icon-512.png", size: 512, ball: 0.34 },
  // Maskable: the mark must stay inside the central 80% safe zone (radius 0.4 of the canvas).
  { file: "icon-maskable-512.png", size: 512, ball: 0.29 },
  { file: "apple-touch-icon.png", size: 180, ball: 0.34 }
];

await mkdir(OUT_DIR, { recursive: true });

for (const { file, size, ball } of targets) {
  const png = await sharp(Buffer.from(iconSvg(size, ball)), { density: 300 })
    .resize(size, size)
    .flatten({ background: BG })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(OUT_DIR, file), png);
  console.log(`wrote ${file} (${size}x${size}, ${png.length} bytes)`);
}
