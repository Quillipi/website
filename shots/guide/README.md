# The setup guide's screenshots

The pictures on `quillipi.app/start`. They come from Karan's newcomer test on 2026-11-22 (S4.5): a
screen recording at 1918 × 1018, started on quillipi.app with no Cloudflare or GitHub account.

Each PNG here is one frame, cropped to the part that matters, with email addresses and the account's
`workers.dev` name blurred. `npm run guide-images` turns them into the AVIF and WebP files in
`public/images/guide/`.

| File | What it shows | Recording |
| --- | --- | --- |
| `github-signup.png` | GitHub's sign-up form, the username accepted | part 3, 0:36 |
| `cf-signup.png` | Cloudflare's sign-up page | part 1, 0:21 |
| `cf-verify.png` | Cloudflare's "Verify your account" box | part 2, 1:10 |
| `cf-connect.png` | The Deploy form before GitHub is connected: New GitHub connection | part 2, 2:52 |
| `gh-install.png` | GitHub: Install & Authorize Cloudflare's app | part 3, 1:16 |
| `cf-no-repos.png` | Cloudflare's "No Git repositories found", where it loses the Deploy button | part 3, 1:46 |
| `cf-form-top.png` | The Deploy form with GitHub connected, private repository ticked | part 3, 2:42 |
| `cf-form-login.png` | The Deploy form's `GITHUB_USER_LOGIN` | part 3, 3:22 |
| `cf-success.png` | The end of the build log, with the address | part 4, 0:16 |
| `quillipi-setup.png` | Quillipi's own setup page, its first step ticked | part 4, 1:41 |

When Cloudflare or GitHub change a screen, take a new screenshot of just that part, hide any email
address, save it here under the same name and run `npm run guide-images`. If its size changed,
update the `width` and `height` of its `<img>` in `public/start.html` to the numbers it prints.
