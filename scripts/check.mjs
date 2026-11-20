// Checks the site before it goes out. Cloudflare runs this before every deploy, and a failure stops
// the deploy, so a half-finished page never reaches quillipi.app.
//
//   node scripts/check.mjs           everything, as for a deploy
//   node scripts/check.mjs --draft   allows the placeholders that are still waiting for screenshots
//                                    and the analytics token, for looking at the page locally
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const draft = process.argv.includes('--draft');
const problems = [];
const notes = [];
const fail = (text) => problems.push(text);
const read = (path) => readFileSync(join(PUBLIC, path), 'utf8');
const text = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();

const pages = readdirSync(PUBLIC).filter((name) => name.endsWith('.html'));
for (const page of pages) {
  const html = read(page);

  // The Content-Security-Policy allows no inline code or styles.
  if (/\sstyle="/.test(html)) fail(`${page}: has a style="…" attribute, which the Content-Security-Policy blocks. Use a class.`);
  if (/\son[a-z]+="/.test(html)) fail(`${page}: has an inline event handler (onclick="…"), which the Content-Security-Policy blocks.`);
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    if (!/\ssrc="/.test(tag) && !/type="application\/ld\+json"/.test(tag)) fail(`${page}: has an inline <script>, which the Content-Security-Policy blocks. Put it in js/.`);
  }
  if (/<style\b/.test(html)) fail(`${page}: has a <style> block, which the Content-Security-Policy blocks. Put it in css/site.css.`);

  // Every local file the page names is there.
  for (const [, ref] of html.matchAll(/(?:href|src|poster)="(\/[^"#?]*)/g)) {
    if (!existsSync(join(PUBLIC, ref === '/' ? 'index.html' : ref))) fail(`${page}: names ${ref}, which isn't in public/.`);
  }
  for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of set.split(',')) {
      const ref = part.trim().split(/\s+/)[0];
      if (ref.startsWith('/') && !existsSync(join(PUBLIC, ref))) fail(`${page}: names ${ref}, which isn't in public/.`);
    }
  }
  // Every link inside the page goes somewhere.
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(id)) fail(`${page}: links to #${id}, which isn't on the page.`);

  // Images say what they show and how big they are, so nothing jumps while the page loads.
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(tag)) fail(`${page}: an <img> has no alt text: ${tag.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) fail(`${page}: an <img> has no width and height: ${tag.slice(0, 80)}`);
  }
  for (const [tag] of html.matchAll(/<video\b[^>]*>/g)) if (!html.includes('<track kind="captions"')) fail(`${page}: the video has no captions: ${tag.slice(0, 60)}`);

  // Each page has one title, one main heading and a description.
  if ((html.match(/<h1\b/g) ?? []).length !== 1) fail(`${page}: should have exactly one <h1>.`);
  if (!/<title>[^<]{10,65}<\/title>/.test(html)) fail(`${page}: its <title> should be 10 to 65 characters.`);
}

const home = read('index.html');
const description = home.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
if (description.length < 70 || description.length > 160) fail(`index.html: the description is ${description.length} characters; search engines show 70 to 160.`);
for (const needed of ['<link rel="canonical" href="https://quillipi.app/">', 'property="og:image" content="https://quillipi.app/', 'name="twitter:card"']) {
  if (!home.includes(needed)) fail(`index.html: is missing ${needed}`);
}

// The structured data parses, and its questions and answers are the ones on the page.
const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (!blocks.length) fail('index.html: has no structured data.');
for (const [, json] of blocks) {
  let data;
  try { data = JSON.parse(json); } catch (error) { fail(`index.html: the structured data isn't valid JSON: ${error.message}`); continue; }
  const faq = data['@graph']?.find((item) => item['@type'] === 'FAQPage');
  const shown = [...home.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(([, q, a]) => [text(q), text(a)]);
  const given = faq?.mainEntity?.map((item) => [item.name, item.acceptedAnswer.text]) ?? [];
  if (shown.length !== given.length) fail(`index.html: ${shown.length} questions on the page but ${given.length} in the structured data.`);
  shown.forEach(([q, a], index) => {
    const [gq, ga] = given[index] ?? [];
    if (q !== gq) fail(`index.html: question ${index + 1} differs. On the page: "${q}"; in the structured data: "${gq}".`);
    else if (a !== ga) fail(`index.html: the answer to "${q}" differs between the page and the structured data.`);
  });
}

// Placeholders and the analytics token, which a deploy can't go out with. A placeholder may go out
// only inside a hidden frame that names it in data-waits, for a shot that can only be taken later;
// npm run images shows the frame once all its shots are in.
const waiting = [...home.matchAll(/data-slot="([^"]+)"><div class="ph">/g)].map((match) => match[1]);
const later = new Set();
for (const [tag, list] of home.matchAll(/<[a-z]+\b[^>]*\sdata-waits="([^"]+)"[^>]*>/g)) {
  const slots = list.split(/\s+/);
  const open = slots.filter((slot) => waiting.includes(slot));
  for (const slot of slots) if (!home.includes(`data-slot="${slot}"`)) fail(`index.html: data-waits names ${slot}, which has no slot.`);
  if (!/\shidden[\s>]/.test(tag)) continue;
  if (!open.length) fail(`index.html: a frame for ${list} is still hidden though its shots are in. Run npm run images.`);
  for (const slot of open) later.add(slot);
}
const missing = waiting.filter((slot) => !later.has(slot));
if (later.size) notes.push(`index.html: ${[...later].join(', ')} wait, hidden, for shots taken later (shots/SHOTS.md).`);
const token = home.includes('CLOUDFLARE_WEB_ANALYTICS_TOKEN');
if (missing.length) (draft ? notes : problems).push(`index.html: still waiting for ${missing.join(', ')} (npm run images puts them in).`);
if (token) (draft ? notes : problems).push('index.html: the Cloudflare Web Analytics token is still CLOUDFLARE_WEB_ANALYTICS_TOKEN.');

// The files around the page.
for (const file of ['robots.txt', 'sitemap.xml', 'llms.txt', 'site.webmanifest', '_headers', '404.html', '.well-known/security.txt', 'images/og.png']) {
  if (!existsSync(join(PUBLIC, file))) fail(`public/${file} is missing.`);
}
JSON.parse(read('site.webmanifest'));
const expires = Date.parse(read('.well-known/security.txt').match(/^Expires: (.+)$/m)?.[1] ?? '');
const days = (expires - Date.now()) / 86400000;
if (!(days > 0)) fail('security.txt has expired. Set Expires to a date within the next year.');
else if (days < 30) fail(`security.txt expires in ${Math.floor(days)} days. Set Expires to a date within the next year.`);
if (!read('_headers').includes('Content-Security-Policy:')) fail('_headers has no Content-Security-Policy.');

// Cloudflare serves files up to 25 MiB.
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
for (const file of walk(PUBLIC)) if (statSync(file).size > 25 * 1024 * 1024) fail(`${file.slice(ROOT.length + 1)} is over 25 MiB, the most Cloudflare serves.`);

for (const note of notes) console.log(`Note: ${note}`);
if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(draft ? 'Draft check passed.' : 'Everything checked. Ready to deploy.');
