/**
 * Flatten CAD kiosk SVGs to lossless WebP. Occupancy fills stay as SVG overlays
 * in the app; this only replaces the heavy background drawing.
 *
 * Usage: node scripts/rasterize-floors.mjs [svg...]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DPI = 240;

function targets() {
  if (process.argv.length > 2) {
    return process.argv.slice(2).map((item) => path.resolve(item));
  }
  const dir = path.join(ROOT, "public/floorplans");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".svg"))
    .map((name) => path.join(dir, name));
}

async function rasterize(svgPath) {
  const outPath = svgPath.replace(/\.svg$/i, ".webp");
  const started = Date.now();
  const png = await sharp(svgPath, { density: DPI, limitInputPixels: false })
    .png()
    .toBuffer();
  const webp = await sharp(png).webp({ lossless: true }).toBuffer();
  fs.writeFileSync(outPath, webp);
  const meta = await sharp(webp).metadata();
  const svgKb = fs.statSync(svgPath).size / 1024;
  const webpKb = webp.length / 1024;
  console.log(
    `${path.basename(svgPath)}  ${svgKb.toFixed(0)} KB SVG -> ${webpKb.toFixed(0)} KB WebP  ${meta.width}x${meta.height}  ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  return outPath;
}

for (const svgPath of targets()) {
  await rasterize(svgPath);
}
