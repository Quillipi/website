// Puts the screenshots and the demo video into the page.
//
// Drop the files into shots/ under their slot's name: SHOT-01.png ... SHOT-08.png, and for the video
// VID-01.mp4, VID-01.vtt (captions) and VID-01-poster.png. Then run `npm run images`. Each image is
// cropped from its top-left corner to its slot's shape, saved as AVIF and WebP in two sizes in
// public/images/shots/, and its slot's placeholder in public/index.html becomes a <picture>. Slots
// whose file isn't there yet stay as they are, so it can run as often as needed. A frame marked
// hidden with data-waits="SHOT-01 SHOT-02" is shown once all the shots it names are in.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'shots');
const PAGE = join(ROOT, 'public', 'index.html');
const OUT = join(ROOT, 'public', 'images', 'shots');
const MEDIA = join(ROOT, 'public', 'media');
const MAX_FILE = 25 * 1024 * 1024; // Cloudflare serves files up to 25 MiB
const slots = JSON.parse(readFileSync(join(SHOTS, 'shots.json'), 'utf8'));
const placeholder = (id) => new RegExp(`(<div class="(?:shot|screen[^"]*)" data-slot="${id}">)<div class="ph">[\\s\\S]*?</div>(</div>)`);
const escape = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let html = readFileSync(PAGE, 'utf8');
let done = 0;
mkdirSync(OUT, { recursive: true });

for (const [id, slot] of Object.entries(slots)) {
  if (!placeholder(id).test(html)) continue; // already in
  const name = id.toLowerCase();

  if (slot.video) {
    const file = join(SHOTS, `${id}.mp4`), captions = join(SHOTS, `${id}.vtt`), poster = join(SHOTS, `${id}-poster.png`);
    if (!existsSync(file)) continue;
    for (const needed of [captions, poster]) if (!existsSync(needed)) throw new Error(`${id} needs ${needed} too.`);
    if (statSync(file).size > MAX_FILE) {
      throw new Error(`${id}.mp4 is ${(statSync(file).size / 1048576).toFixed(1)} MiB; Cloudflare serves up to 25. Make it smaller with:\n  ffmpeg -i shots/${id}.mp4 -c:v libx264 -preset veryfast -crf 28 -vf scale=1920:-2 -movflags +faststart -c:a aac -b:a 96k shots/${id}-small.mp4\nthen use that file as shots/${id}.mp4.`);
    }
    mkdirSync(MEDIA, { recursive: true });
    copyFileSync(file, join(MEDIA, 'demo.mp4'));
    copyFileSync(captions, join(MEDIA, 'demo.vtt'));
    await sharp(poster).resize(slot.width, slot.height, { fit: 'cover', position: 'left top' }).webp({ quality: 82 }).toFile(join(MEDIA, 'demo-poster.webp'));
    html = html.replace(placeholder(id), `$1<video controls playsinline preload="none" width="${slot.width}" height="${slot.height}" poster="/media/demo-poster.webp" aria-label="${escape(slot.title)}"><source src="/media/demo.mp4" type="video/mp4"><track kind="captions" src="/media/demo.vtt" srclang="en" label="English" default></video>$2`);
    // Search engines and AI assistants learn about the video from the structured data too.
    const video = { '@type': 'VideoObject', '@id': 'https://quillipi.app/#demo', name: slot.title, description: slot.description, thumbnailUrl: 'https://quillipi.app/media/demo-poster.webp', contentUrl: 'https://quillipi.app/media/demo.mp4', uploadDate: new Date().toISOString().slice(0, 10), inLanguage: 'en' };
    html = html.replace('    {\n      "@type": "FAQPage",', `    ${JSON.stringify(video)},\n    {\n      "@type": "FAQPage",`);
    console.log(`${id}: in, as /media/demo.mp4 with captions, a poster and its structured data`);
    done++;
    continue;
  }

  const source = join(SHOTS, `${id}.png`);
  if (!existsSync(source)) continue;
  const [rw, rh] = slot.ratio;
  const widest = slot.widths[slot.widths.length - 1];
  const { width: have } = await sharp(source).metadata();
  if (have < widest) console.warn(`${id}: ${have}px wide, smaller than the ${widest}px it's shown at on sharp screens. It will look soft.`);
  const sets = { avif: [], webp: [] };
  for (const width of slot.widths) {
    const height = Math.round((width * rh) / rw);
    const base = sharp(source).resize(width, height, { fit: 'cover', position: 'left top' });
    await base.clone().avif({ quality: 55, effort: 6 }).toFile(join(OUT, `${name}-${width}.avif`));
    await base.clone().webp({ quality: 80 }).toFile(join(OUT, `${name}-${width}.webp`));
    sets.avif.push(`/images/shots/${name}-${width}.avif ${width}w`);
    sets.webp.push(`/images/shots/${name}-${width}.webp ${width}w`);
  }
  const height = Math.round((widest * rh) / rw);
  const picture = `<picture><source type="image/avif" srcset="${sets.avif.join(', ')}" sizes="${slot.sizes}"><source type="image/webp" srcset="${sets.webp.join(', ')}" sizes="${slot.sizes}"><img src="/images/shots/${name}-${widest}.webp" width="${widest}" height="${height}" alt="${escape(slot.alt)}" loading="lazy" decoding="async"></picture>`;
  html = html.replace(placeholder(id), `$1${picture}$2`);
  console.log(`${id}: in, ${slot.widths.join(' and ')} px wide`);
  done++;
}

// A frame hidden until its shots were in is shown once none of them is waiting.
html = html.replace(/(<[a-z]+\b[^>]*?)\sdata-waits="([^"]+)"([^>]*?)\shidden([^>]*>)/g, (tag, start, list, middle, end) =>
  list.split(/\s+/).some((id) => placeholder(id).test(html)) ? tag : `${start}${middle}${end}`);

writeFileSync(PAGE, html);
const left = Object.keys(slots).filter((id) => placeholder(id).test(html));
console.log(done ? `${done} put in.` : 'Nothing new to put in.', left.length ? `Still waiting for: ${left.join(', ')}.` : 'Every slot is filled.');
