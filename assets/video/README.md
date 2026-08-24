# Hero background video

`hero.mp4` is a **placeholder**, generated from `assets/images/neural-brain-hero.png`
so the hero layout could be built and reviewed against real playback.

It is deliberately blurred. The source art has text baked into it
("Humans Don't Think in Prompts", chat bubbles) which collided with the
headline when used sharp — a hero background has to be atmospheric, not
informational.

## Replacing it

Drop your own file in as `hero.mp4`. Nothing else needs changing. To match
the encode:

```
ffmpeg -i YOUR.mov -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p \
       -an -movflags +faststart assets/video/hero.mp4

ffmpeg -i assets/video/hero.mp4 -vframes 1 -q:v 6 assets/video/hero-poster.jpg
```

What matters:

| Flag | Why |
|---|---|
| `-movflags +faststart` | puts the index at the head of the file so playback starts before the whole thing downloads |
| `-an` | strips audio — the element is muted anyway, so audio is dead weight |
| `-pix_fmt yuv420p` | required for Safari/iOS to decode at all |
| the poster | first paint, and the still shown under `prefers-reduced-motion` |

Keep it small — this loads on every homepage visit. The current file is
439 KB for 14s at 1920x1080; anything past ~2 MB is worth reconsidering.

The markup already carries `autoplay muted loop playsinline` — `muted` and
`playsinline` are what make autoplay permitted at all, so do not remove them.
Autoplay refusal is handled in `main.js`; the poster simply stays up.
