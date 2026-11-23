// Makes the setup guide's screenshots (public/start.html) from the PNGs in shots/guide/.
//
// Each PNG is already cropped, with email addresses blurred (shots/guide/README.md says how). This
// saves it as AVIF and WebP at its own width in public/images/guide/ and prints the <img> size to
// use. When Cloudflare or GitHub change a screen, replace its PNG and run `npm run guide-images`.
import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'shots', 'guide');
const OUT = join(ROOT, 'public', 'images', 'guide');
mkdirSync(OUT, { recursive: true });

for (const file of readdirSync(SOURCE).filter((name) => name.endsWith('.png')).sort()) {
  const name = file.slice(0, -4);
  const image = sharp(join(SOURCE, file));
  const { width, height } = await image.metadata();
  await image.clone().avif({ quality: 60, effort: 6 }).toFile(join(OUT, `${name}.avif`));
  await image.clone().webp({ quality: 84 }).toFile(join(OUT, `${name}.webp`));
  console.log(`${name}: ${width} × ${height}`);
}
