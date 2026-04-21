import sharp from "sharp";
import { statSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = "/Users/macbookpro/Downloads";
const OUT_DIR = "client/public/images/locations";

// Desktop = source aspect (16:9), mobile = 4:5 portrait with top-crop so the
// dominant vertical subject (castle / cliff line) stays framed when an
// h-dvh hero occupies most of a phone screen.
const VARIANTS = [
  { suffix: "",        width: 1920, height: 1080, position: "center" },
  { suffix: "-mobile", width:  768, height:  960, position: "top"    },
];

// Quality per format matches the brief (AVIF 60 / WebP 75 / JPG 80).
const FORMATS = [
  { ext: "avif", opts: { quality: 60, effort: 4 } },
  { ext: "webp", opts: { quality: 75, effort: 4 } },
  { ext: "jpg",  opts: { quality: 80, progressive: true, mozjpeg: true } },
];

const SOURCES = [
  { slug: "hero-lloret-de-mar", src: "client:public:images:locations:hero-lloret-de-mar.jpg.jpg.png" },
  { slug: "hero-tossa-de-mar",  src: "client:public:images:locations:hero-tossa-de-mar.jpg.png" },
];

async function encode(input, variant, format) {
  const pipeline = sharp(input).resize({
    width: variant.width,
    height: variant.height,
    fit: "cover",
    position: variant.position,
  });
  switch (format.ext) {
    case "avif": return pipeline.avif(format.opts);
    case "webp": return pipeline.webp(format.opts);
    case "jpg":  return pipeline.jpeg(format.opts);
    default: throw new Error(`unknown format ${format.ext}`);
  }
}

const results = [];
for (const src of SOURCES) {
  const input = join(SRC_DIR, src.src);
  for (const variant of VARIANTS) {
    for (const format of FORMATS) {
      const outPath = join(OUT_DIR, `${src.slug}${variant.suffix}.${format.ext}`);
      const pipeline = await encode(input, variant, format);
      await pipeline.toFile(outPath);
      const size = statSync(outPath).size;
      results.push({ path: outPath, bytes: size, kb: Math.round(size / 1024) });
      console.log(`  ${outPath}: ${Math.round(size / 1024)} KB`);
    }
  }
}

console.log("\n=== Size check against brief targets ===");
const TARGETS = { avif: 120, webp: 200, jpg: 350, ceiling: 500 };
let warnings = 0;
for (const r of results) {
  const ext = r.path.split(".").pop();
  const target = TARGETS[ext];
  if (r.kb > TARGETS.ceiling) {
    console.log(`  ⚠️  ${r.path}: ${r.kb} KB (OVER ceiling ${TARGETS.ceiling} KB)`);
    warnings++;
  } else if (r.kb > target * 1.3) {
    console.log(`  ⚠ ${r.path}: ${r.kb} KB (target ~${target} KB)`);
  }
}
if (warnings === 0) {
  console.log("  ✓ All variants under the 500 KB ceiling");
}
