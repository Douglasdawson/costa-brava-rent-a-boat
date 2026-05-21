// Generates PWA maskable icons from client/public/assets/logo-icon-512.png.
//
// Maskable spec: Android adaptive icons crop the outer 20% — the icon must
// keep all branding inside an 80% "safe zone" or it gets clipped. Our source
// logo touches the edges of its canvas, so we down-scale it to 80% and
// composite it onto a brand-white background sized for the target.
//
// Outputs (overwrites existing):
//   client/public/assets/logo-icon-192-maskable.png  (192x192)
//   client/public/assets/logo-icon-512-maskable.png  (512x512)
//   client/public/assets/logo-icon-192.png           (192x192, edge-bleed)
//
// The 192 "any" variant is a straight downscale of the 512 source — used
// for non-maskable purposes and as the apple-touch-icon at 180. The 512
// "any" we leave as-is (logo-icon-512.png).
//
// Run: node scripts/generate-maskable-icons.mjs

import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_ASSETS = path.resolve(__dirname, "../client/public/assets");
const SOURCE = path.join(PUBLIC_ASSETS, "logo-icon-512.png");

// White background matches the existing manifest background_color and gives
// the navy logo enough contrast to read against any system wallpaper.
const BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function maskable(size, outName) {
  const inner = Math.round(size * 0.8);
  const offset = Math.round((size - inner) / 2);
  const logo = await sharp(SOURCE)
    .resize(inner, inner, { fit: "contain", background: BG })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_ASSETS, outName));
  console.log(`  ${outName} (${size}x${size})`);
}

async function plain(size, outName) {
  await sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: BG })
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_ASSETS, outName));
  console.log(`  ${outName} (${size}x${size})`);
}

console.log("Generating PWA icons:");
await plain(192, "logo-icon-192.png");
await maskable(192, "logo-icon-192-maskable.png");
await maskable(512, "logo-icon-512-maskable.png");
console.log("done.");
