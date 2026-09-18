# Fonts

## britney.woff2  (self-hosted)

`Britney` (Zetafonts) is a commercial typeface and is not on Google Fonts, so
it is self-hosted here instead of being linked from a CDN.

- Converted from the licensed `Britney-Bold.otf` desktop file
- 43.6 KB OTF -> 27.1 KB WOFF2
- Declared at `font-weight: 700` in `assets/css/style.css`, because this is
  the static Bold cut and not a variable font

Used only by `--font-hero-accent`, which styles the `.gradient-text` span in
hero titles ("We're Teaching Them to Perceive.", "Cognitive Layer").

### Adding other weights

Britney also ships Light / Regular / Ultra. To add one, convert it the same
way and add a matching `@font-face` with the correct `font-weight`:

```
node -e "const w=require('wawoff2'),f=require('fs');(async()=>{
  f.writeFileSync('assets/fonts/britney-regular.woff2',
    Buffer.from(await w.compress(f.readFileSync('PATH/TO/Britney-Regular.otf'))))})()"
```

### Licensing

Desktop font licences do not always include webfont embedding rights, which
are usually sold separately. Serving this file publicly needs a webfont
licence from Zetafonts: https://www.zetafonts.com/britney

If that is not in place, delete `britney.woff2`, the `@font-face` block, and
the `'Britney'` entry in `--font-hero-accent` — hero titles then fall back to
Quicksand, which is already the declared fallback.
