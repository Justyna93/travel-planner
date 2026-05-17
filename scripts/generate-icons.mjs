// One-off icon rasterizer.
// Reads public/icons/source.svg and writes the PNG variants the PWA manifest
// and iOS expect. Run with `node scripts/generate-icons.mjs` after `npm i --no-save sharp`.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(here, "..", "public", "icons");
const appDir = resolve(here, "..", "app");
const svg = await readFile(resolve(iconsDir, "source.svg"));

const variants = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  // iOS home screen — must be square with no transparency. The SVG already has
  // a solid blue background, so the same rendering is correct for Apple.
  { file: "apple-touch-icon.png", size: 180 },
];

for (const v of variants) {
  const out = resolve(iconsDir, v.file);
  await sharp(svg, { density: 384 })
    .resize(v.size, v.size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out}`);
}

// Favicon: a small ICO would be ideal, but Next.js auto-serves whatever PNG/ICO
// is at app/icon.* or app/favicon.ico. We'll write a 64×64 PNG as app/icon.png,
// which Next picks up and serves at /favicon.ico-equivalent paths.
const faviconOut = resolve(appDir, "icon.png");
await sharp(svg, { density: 256 })
  .resize(64, 64, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(faviconOut);
console.log(`wrote ${faviconOut}`);
