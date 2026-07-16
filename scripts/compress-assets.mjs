/**
 * One-off script: compress large /public/landing/* assets so the first paint
 * doesn't drag multi-MB JPEGs down the wire.
 *
 *   node scripts/compress-assets.mjs
 *
 * Safe to re-run — outputs a sibling file with a `.compressed` suffix and
 * only replaces the original if the new file is strictly smaller.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public", "landing");

const TARGETS = [
  // file,        maxWidth, jpegQuality, webpQuality
  ["parallax-court.jpg", 1920, 70, 75],
  ["hero-courtroom.jpg", 1920, 72, 78],
  ["justice.jpg",        1280, 70, 75],
  ["courthouse.jpg",     1600, 70, 75],
  ["library.jpg",        1600, 70, 75],
  ["chamber.jpg",        1600, 70, 75],
  ["lawbook.jpg",        1280, 70, 75],
  ["papers.jpg",         1280, 70, 75],
  ["pen.jpg",             900, 72, 78],
  ["mesh.jpg",           1280, 72, 78],
  ["hero-library.jpg",   1920, 70, 75],
  ["research-img.jpg",   1280, 72, 78],
  ["drafting-img.jpg",   1280, 72, 78],
];

async function compressOne(file, maxWidth, jpegQuality, webpQuality) {
  const src = path.join(PUBLIC_DIR, file);
  if (!fs.existsSync(src)) {
    console.warn(`skip ${file} (not found)`);
    return;
  }
  const beforeStat = fs.statSync(src);
  const before = beforeStat.size;
  const img = sharp(src, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  if (meta.width && meta.width > maxWidth) {
    img.resize({ width: maxWidth, withoutEnlargement: true });
  }

  const tmpJpg = path.join(PUBLIC_DIR, `${file}.recompressed.jpg`);
  await img
    .clone()
    .jpeg({ quality: jpegQuality, mozjpeg: true, progressive: true })
    .toFile(tmpJpg);
  const jpgStat = fs.statSync(tmpJpg);

  // Also emit a .webp alongside (some users will get the smaller one via Next).
  const tmpWebp = path.join(PUBLIC_DIR, `${file}.recompressed.webp`);
  await img
    .clone()
    .webp({ quality: webpQuality })
    .toFile(tmpWebp);
  const webpStat = fs.statSync(tmpWebp);

  const winnerJpg = jpgStat.size;
  const winnerPath = tmpJpg;
  const winnerBytes = jpgStat.size;

  if (winnerBytes < before) {
    fs.renameSync(tmpJpg, src);
    fs.renameSync(tmpWebp, src.replace(/\.jpg$/, ".webp"));
    const pct = (((before - winnerBytes) / before) * 100).toFixed(1);
    console.log(
      `✓ ${file.padEnd(22)}  ${(before / 1024).toFixed(0)}KB → ${(winnerBytes / 1024).toFixed(0)}KB  (−${pct}%)   + .webp ${(webpStat.size / 1024).toFixed(0)}KB`,
    );
  } else {
    fs.unlinkSync(tmpJpg);
    fs.unlinkSync(tmpWebp);
    console.log(
      `  ${file.padEnd(22)}  ${(before / 1024).toFixed(0)}KB (no improvement; skip)`,
    );
  }
}

(async () => {
  console.log(`Compressing assets in ${PUBLIC_DIR}\n`);
  for (const args of TARGETS) {
    try {
      await compressOne(...args);
    } catch (e) {
      console.error(`✗ ${args[0]}: ${e.message}`);
    }
  }
  console.log("\nDone.");
})();
