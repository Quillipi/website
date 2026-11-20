# quillipi.app

Quillipi's homepage. Quillipi itself is at [quillipi/quillipi](https://github.com/quillipi/quillipi).

The site is just files in `public/`, with no framework, no build step and no code from other
sites. Cloudflare serves it at `https://quillipi.app` as the Worker `quillipi-website`, with static
assets and no code of its own. A push to `main` deploys it, but only after `npm run check` passes.

## Working on it

```
npm install
npm run dev        # http://localhost:8787, with the placeholders allowed
npm run check      # everything a deploy checks
```

| Path | What it is |
| --- | --- |
| `public/index.html` | The page |
| `public/css/site.css`, `public/js/site.js` | Its only stylesheet and script. The page works without the script |
| `public/fonts/` | Inter and Newsreader, served from here and not from Google, under the SIL Open Font License |
| `public/images/` | Icons, the closing illustration, `og.png` (the image shown when the link is shared) and the screenshots in `shots/` |
| `public/media/` | The demo video, its captions and its poster, once they're in |
| `public/_headers` | Security headers and caching |
| `public/robots.txt`, `sitemap.xml`, `llms.txt`, `.well-known/security.txt` | For search engines, AI assistants and security researchers |
| `public/404.html` | The page for an address that doesn't exist |
| `shots/` | Where the screenshots and the video go before `npm run images` puts them in, with the shot list in [shots/SHOTS.md](shots/SHOTS.md) |
| `design/og.html` | The source of `og.png`. `python3 design/og.py` makes the PNG again (it needs Playwright and Pillow) |
| `scripts/check.mjs` | Runs before every deploy |

## What a deploy checks

`npm run check` stops a deploy if any of these is wrong:

- There are no inline scripts, styles or event handlers, which the Content-Security-Policy would
  block.
- Every file the page names exists, and every `#link` goes somewhere on the page.
- Every image has alt text and a width and height.
- The video has captions.
- There is one `<h1>`, the title is 10 to 65 characters and the description is 70 to 160.
- The questions in the structured data are word for word the ones on the page.
- No placeholder is waiting for a screenshot, and the analytics token is set. The one exception is a
  frame marked `hidden` whose `data-waits` names the shots it waits for, for a shot that can only be
  taken later: it stays out of sight, and `npm run images` shows it once they're in.
- `security.txt` doesn't expire within 30 days. Renew its `Expires` line every year.
- No file is over 25 MiB, the most Cloudflare serves.

## Privacy and security

The site counts visits with Cloudflare Web Analytics, which uses no cookies, and loads nothing
else from anywhere. Its headers allow only its own files and that counter, refuse to be shown
inside other sites, and keep HTTPS on. Every `.app` domain is HTTPS-only already.

## How it's deployed

Cloudflare's Workers Builds runs on every push to `main`, from the repository `Quillipi/website`:

| Setting | Value |
| --- | --- |
| Worker | `quillipi-website` (the `name` in `wrangler.jsonc`) |
| Build command | `npm run check` |
| Deploy command | `npx wrangler deploy` |
| Domain | `quillipi.app`, a Custom Domain set in `wrangler.jsonc`, so Cloudflare makes its DNS record and certificate |

Web Analytics for `quillipi.app` is set to "Enable with JS Snippet installation", so the page's own
snippet counts each visit once and Cloudflare injects nothing.

## License

Source-available under the [PolyForm Shield License 1.0.0](LICENSE), like Quillipi. The fonts are
under the SIL Open Font License (`public/fonts/`).
