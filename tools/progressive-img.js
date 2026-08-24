// Annotates content <img> tags for progressive loading:
//   - intrinsic width/height  (kills layout shift)
//   - inline LQIP as background-image (blur-up placeholder)
//   - decoding="async"; first content image is eager + high priority (LCP),
//     every later one is lazy
// Idempotent: re-running rewrites the same attributes rather than stacking them.
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/Situational AI website';
const LQIP = JSON.parse(fs.readFileSync(path.join(__dirname, 'lqip.json'), 'utf8'));
const PAGES = [
  'index.html', 'vision.html', 'blog/index.html',
  'blog/introducing-situational-ai.html', 'blog/context-is-everything.html',
  'blog/why-not-another-agent-framework.html',
];

function dims(buf) {
  if (buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let o = 2;
    while (o < buf.length) {
      if (buf[o] !== 0xFF) { o++; continue; }
      const m = buf[o + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        return [buf.readUInt16BE(o + 7), buf.readUInt16BE(o + 5)];
      }
      o += 2 + buf.readUInt16BE(o + 2);
    }
  }
  return null;
}

const getAttr = (tag, name) => {
  const m = tag.match(new RegExp(name + '="([^"]*)"', 'i'));
  return m ? m[1] : null;
};
const dropAttr = (tag, name) =>
  tag.replace(new RegExp('\\s' + name + '="[^"]*"', 'ig'), '');

let totals = { touched: 0, skipped: 0 };

for (const page of PAGES) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, 'utf8');
  let first = true;
  let n = 0;

  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = getAttr(tag, 'src');
    if (!src) return tag;

    const base = src.split('/').pop();
    const lqip = LQIP[base];
    if (!lqip) { totals.skipped++; return tag; }   // logo/icon — leave alone

    const abs = path.join(ROOT, 'assets/images', base);
    if (!fs.existsSync(abs)) return tag;
    const d = dims(fs.readFileSync(abs));

    // strip anything a previous run added, so this stays idempotent
    let out = tag;
    ['loading', 'decoding', 'fetchpriority', 'width', 'height'].forEach(a => {
      out = dropAttr(out, a);
    });

    // merge, never clobber, the author's class and style
    const cls = (getAttr(out, 'class') || '')
      .split(/\s+/).filter(c => c && c !== 'sai-progressive');
    cls.push('sai-progressive');
    out = dropAttr(out, 'class');

    let style = (getAttr(out, 'style') || '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !/^background-image\s*:/i.test(s));
    style.push("background-image:url('" + lqip + "')");
    out = dropAttr(out, 'style');

    const extra = [
      'class="' + cls.join(' ') + '"',
      d ? 'width="' + d[0] + '" height="' + d[1] + '"' : '',
      'decoding="async"',
      // First content image is the LCP candidate: fetch it eagerly and let the
      // preloader wait on it. Everything below the fold defers.
      first ? 'fetchpriority="high"' : 'loading="lazy"',
      'style="' + style.join('; ') + '"',
    ].filter(Boolean).join(' ');

    first = false;
    n++;
    totals.touched++;
    return out.replace(/\s*\/?>$/, ' ' + extra + '>');
  });

  fs.writeFileSync(file, html);
  console.log(page.padEnd(46), n + ' image(s) made progressive');
}

console.log('\n' + totals.touched + ' annotated, ' + totals.skipped + ' logos/icons left untouched');
