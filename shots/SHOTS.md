# Screenshots and the demo video

The homepage goes live before the newcomer test, so its pictures come from two places
(decided 2026-11-21):

- **From Karan's own Quillipi, now:** SHOT-03, SHOT-04, SHOT-05, SHOT-06, SHOT-08 and VID-01.
  They all happen inside one demo notebook, so nothing else of Karan's shows.
- **From the newcomer test's Quillipi (S4.5), later:** SHOT-01 and SHOT-02 (Home, which lists every
  notebook, and Quillipi can't hide one yet) and SHOT-07 (the setup page as it ticks, which only a
  fresh copy shows). Until then their frames are `hidden` with `data-waits` in `index.html`, and the
  deploy check allows that. Dropping the three files here and running `npm run images` shows them.

## Before taking any

1. A notebook called **launch-plan** to show, with a few sections: **Pricing**, **Who it's for**,
   **Launch**, **Decisions**, and a folder or two. Real-looking text, not lorem ipsum. Claude can
   make it and fill it from a chat.
2. In your own Quillipi, stay inside launch-plan: don't show Home or the open notebook switcher,
   which list your other notebooks.
3. In Chrome, open DevTools (F12), click the device icon (Ctrl+Shift+M), choose **Responsive**,
   set the size below and set **DPR** to 2. Take each shot with DevTools' menu (⋮) →
   **Capture screenshot**. That captures only the page, never the address bar, at twice the size,
   so it stays sharp on any screen.
4. For SHOT-04 and the video, the chat shows the connector's name. Add a custom connector in
   claude.ai named **Quillipi** with the same address as InkLog Cloud
   (`https://inklog.quillipi.workers.dev/mcp`), and in that chat turn InkLog Cloud off and Quillipi
   on, so the chat says Quillipi.
5. Save each one here, named exactly as below (SHOT-03.png and so on). Then `npm run images`.

Each image is cropped from its top-left corner to its frame's shape, so keep what matters toward
the top left.

| Name | Size in DevTools | From | What it shows |
| --- | --- | --- | --- |
| SHOT-01 | 1440 × 900 | Test copy (S4.5) | Home: the notebooks as folders, Recently edited, the backup card. |
| SHOT-02 | 390 × 845 | Test copy (S4.5) | Home on a phone, installed as an app. A real phone screenshot works too. |
| SHOT-03 | 1400 × 900 | Karan's | launch-plan / Pricing open, after Claude changed one paragraph and before it's committed: the orange mark in the margin and the History panel open on the right. |
| SHOT-04 | 1400 × 900 | Karan's | A claude.ai chat: the message "read my launch plan" and Claude's answer, which shows it knows the project. Hide the sidebar and anything personal. |
| SHOT-05 | 1200 × 900 | Karan's | The History panel with Claude's commit opened, showing the sections it touched. |
| SHOT-06 | 1400 × 900 | Karan's | launch-plan's overview: folders and sections as rows with their last commit. |
| SHOT-07 | 1200 × 900 | Test copy (S4.5) | The first-time setup page with its steps ticked. Take it during the test, as it happens. |
| SHOT-08 | 1200 × 900 | Karan's | launch-plan's instructions editor with a few real instructions in it. |

During the test, time the setup from pressing Deploy to the first notebook. Until then the page
names no time ("From one button to your first notebook", "Set it up in your browser, free"); in
S4.6 the measured time goes into the setup card's heading and the closing line.

## The demo video, VID-01 (60 to 90 seconds)

Record 16:9, ideally 1920 × 1080, with no sound or a calm voice-over. Use the Claude desktop app and
the installed Quillipi app, each maximised, so no address bar shows, and switch with Alt+Tab. On
Windows, the Snipping Tool records the screen (Win+Shift+R, select the whole screen). Save it as
`VID-01.mp4`, a still from it as `VID-01-poster.png`, and its captions as `VID-01.vtt` (Claude can
write the captions from the video).

1. **0–10 s.** A new chat. Type "read my launch plan".
2. **10–30 s.** Claude reads the map and the sections it needs, then answers with what the plan
   says: it knows the project from one line.
3. **30–50 s.** Ask "teams should pay one flat price, not per seat; update the pricing". Claude
   changes that one paragraph.
4. **50–75 s.** Switch to Quillipi, already open on launch-plan / Pricing: the orange mark in the
   margin, the old line and the new one, and Claude's commit in History.
5. **75–90 s.** Open the commit to show the one paragraph it touched, or undo it and redo it. End
   there, not on Home.

Captions follow what's on screen, one short line at a time, for example:

```
WEBVTT

00:00.000 --> 00:04.000
A new chat with Claude. One line: "read my launch plan".
```

If the video is over 25 MB, `npm run images` prints the command that makes it smaller.
