// Generates the PWA icons in public/icons/ from a single vector mark.
// Run manually when the brand mark changes: node scripts/generate-pwa-icons.mjs
// Requires `sharp`, which ships with Next.js (no extra dependency needed).
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import sharp from "sharp";

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

// Brand tokens, copied from src/styles/base.css
const BG = "#05070a";
const BG_GLOW = "#1a1f29";
const GOLD = "#ffc400";
const GOLD_LIGHT = "#ffdd55";
const GOLD_DEEP = "#e7a900";

// Volleyball panel seams for a unit circle centered on the origin. A pinwheel of three
// curved arms (rotated 120 degrees apart), each with a parallel companion seam.
const SEAM_MAIN = "M 0 0 C 0.02 -0.55 0.4 -0.9 0.98 -0.2";
const SEAM_EDGE = "M -0.62 -0.3 C -0.35 -0.62 0.05 -0.92 0.5 -0.87";

function iconSvg(size, ballRatio) {
  const r = size * ballRatio;
  const c = size / 2;
  const stroke = 0.075;
  const seams = [0, 120, 240]
    .map(
      (deg) =>
        `<g transform="rotate(${deg})"><path d="${SEAM_MAIN}"/><path d="${SEAM_EDGE}"/></g>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="28%" r="78%">
      <stop offset="0" stop-color="${BG_GLOW}"/>
      <stop offset="0.62" stop-color="${BG}"/>
      <stop offset="1" stop-color="#020304"/>
    </radialGradient>
    <linearGradient id="ball" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${GOLD_LIGHT}"/>
      <stop offset="0.55" stop-color="${GOLD}"/>
      <stop offset="1" stop-color="${GOLD_DEEP}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0.55" stop-color="${GOLD}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="clip"><circle cx="0" cy="0" r="1"/></clipPath>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <circle cx="${c}" cy="${c}" r="${r * 1.6}" fill="url(#halo)"/>
  <g transform="translate(${c} ${c}) scale(${r})">
    <circle r="1" fill="url(#ball)"/>
    <g clip-path="url(#clip)" fill="none" stroke="${BG}" stroke-width="${stroke}" stroke-linecap="round" opacity="0.88">${seams}</g>
    <circle r="1" fill="none" stroke="${BG}" stroke-opacity="0.35" stroke-width="${stroke * 0.6}"/>
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
