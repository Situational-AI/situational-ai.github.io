// Injects the preloader (critical CSS in <head>, markup + boot script after <body>)
// into every page. Idempotent: strips any previous injection first.
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/Situational AI website';
const PAGES = [
  'index.html',
  'vision.html',
  'blog/index.html',
  'blog/introducing-situational-ai.html',
  'blog/context-is-everything.html',
  'blog/why-not-another-agent-framework.html',
];

const CSS = `  <!-- preloader:start -->
  <style>
    /* Critical, inlined so the loader paints on the first frame — before the
       stylesheet and webfonts arrive. Background matches --color-bg exactly so
       lifting the curtain is a crossfade, not a flash. */
    .sai-preloader {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #FFFFFF;
      transition: opacity .6s ease, visibility .6s ease;
    }

    .sai-preloader.is-done {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    /* Same blueprint grid as the page, so the loader reads as the site
       assembling itself rather than as a separate screen. */
    .sai-preloader::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(28, 31, 34, .05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(28, 31, 34, .05) 1px, transparent 1px);
      background-size: 68px 68px;
      -webkit-mask-image: radial-gradient(ellipse 120% 80% at 50% 50%, #000, transparent 78%);
      mask-image: radial-gradient(ellipse 120% 80% at 50% 50%, #000, transparent 78%);
    }

    /* Vertical falloff. Without it the beams are full-height curtains that
       flood the screen; masked to a band they read as a wave crossing it. */
    .sai-wave {
      position: absolute;
      inset: 0;
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 26%, #000 74%, transparent 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, #000 26%, #000 74%, transparent 100%);
    }

    /* Three offset beams travelling left to right. The stagger is what makes
       it read as a wave of light rather than a single moving bar — kept tight
       so the crest and its pale trail are on screen together. */
    .sai-beam {
      position: absolute;
      top: -25%;
      bottom: -25%;
      left: 0;
      width: 34%;
      filter: blur(56px);
      will-change: transform;
      transform: translate3d(-115%, 0, 0);
      /* Linear on purpose: an eased sweep loiters off-screen at both ends and
         leaves the loader visibly blank for a third of every cycle. */
      animation: sai-sweep 2.4s linear infinite;
    }

    .sai-beam--1 { background: linear-gradient(90deg, transparent, rgba(193, 198, 203, .85) 30%, rgba(120, 127, 135, .70) 66%, transparent); }
    .sai-beam--2 { background: linear-gradient(90deg, transparent, rgba(166, 172, 178, .55) 34%, rgba(65, 70, 76, .35) 70%, transparent); animation-delay: .14s; opacity: .8; }
    .sai-beam--3 { background: linear-gradient(90deg, transparent, rgba(236, 239, 241, .95) 40%, rgba(16, 128, 74, .22) 74%, transparent); animation-delay: .28s; opacity: .85; }

    @keyframes sai-sweep {
      from { transform: translate3d(-115%, 0, 0); }
      to   { transform: translate3d(300%, 0, 0); }
    }

    .sai-preloader__inner {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 22px;
    }

    /* Wordmark asset is white artwork; flip it to ink like the rest of the site. */
    .sai-preloader__mark {
      height: 26px;
      filter: brightness(0);
      opacity: .88;
      animation: sai-breathe 2.4s ease-in-out infinite;
    }

    @keyframes sai-breathe {
      0%, 100% { opacity: .60; }
      50%      { opacity: .95; }
    }

    .sai-preloader__track {
      position: relative;
      width: 188px;
      height: 2px;
      overflow: hidden;
      border-radius: 2px;
      background: rgba(28, 31, 34, .10);
    }

    /* Determinate: scaleX is driven from JS by real asset progress. */
    .sai-preloader__track span {
      position: absolute;
      inset: 0;
      border-radius: 2px;
      background: linear-gradient(90deg, #C1C6CB, #A6ACB2, #787F87, #1C1F22);
      transform: scaleX(0);
      transform-origin: left center;
    }

    /* System sans: Inter has not downloaded yet at this point, and the
       counter must not swap face or reflow mid-count. */
    .sai-preloader__pct {
      font: 500 .7rem/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: .14em;
      color: #A6ACB2;
      font-variant-numeric: tabular-nums;
    }

    /* Motion-sensitive visitors get the same colours, held still. */
    @media (prefers-reduced-motion: reduce) {
      .sai-beam {
        left: 0;
        width: 100%;
        opacity: .22;
        filter: blur(80px);
        transform: none;
        animation: none;
      }
      .sai-preloader__mark { animation: none; opacity: .88; }
    }
  </style>
  <noscript>
    <style>.sai-preloader { display: none; }</style>
  </noscript>
  <!-- preloader:end -->
`;

function markup(prefix) {
  return `<!-- preloader:start -->
<div class="sai-preloader" id="saiPreloader" role="status" aria-live="polite" aria-label="Loading">
  <div class="sai-wave">
    <div class="sai-beam sai-beam--1"></div>
    <div class="sai-beam sai-beam--2"></div>
    <div class="sai-beam sai-beam--3"></div>
  </div>
  <div class="sai-preloader__inner">
    <img class="sai-preloader__mark" src="${prefix}assets/images/situational-ai-logo.png" alt="Situational AI" width="140" height="26">
    <div class="sai-preloader__track"><span id="saiBar"></span></div>
    <div class="sai-preloader__pct" id="saiPct">0%</div>
  </div>
</div>
<script>
  (function () {
    var el = document.getElementById('saiPreloader');
    if (!el) return;

    var bar = document.getElementById('saiBar'),
        pctEl = document.getElementById('saiPct'),
        start = Date.now(),
        MIN_MS = 850,   // let at least one sweep complete, so it never just blinks
        cur = 0,        // what the bar is showing
        target = 0,     // what the loader actually knows
        settled = false,
        lifted = false;

    // Monotonic: progress may only ever move forward.
    function to(v) { if (v > target) target = v > 1 ? 1 : v; }

    // The bar eases toward the real figure instead of snapping to it, so a
    // burst of images finishing at once reads as motion rather than a jump.
    function frame() {
      cur += (target - cur) * 0.14;
      if (target - cur < 0.0015) cur = target;
      bar.style.transform = 'scaleX(' + cur.toFixed(4) + ')';
      pctEl.textContent = Math.round(cur * 100) + '%';
      if (settled && cur >= 0.999) { lift(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function lift() {
      if (lifted) return;
      lifted = true;
      setTimeout(function () {
        el.classList.add('is-done');
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 700);
      }, Math.max(0, MIN_MS - (Date.now() - start)));
    }

    function finish() {
      settled = true;
      clearInterval(creep);
      clearInterval(trickle);
      to(1);
    }

    to(0.06);

    // While the document is still parsing there is nothing real to measure,
    // so creep — but cap it, so we never claim progress we do not have.
    var creep = setInterval(function () { to(Math.min(0.25, target + 0.02)); }, 120);

    // A single large image (the 2.1MB hero) can hold one count for seconds.
    // The figure is honest but a frozen number reads as a hung page, so ease
    // asymptotically toward a ceiling we are not allowed to cross. Real
    // events always overtake this; it only ever fills a stall.
    var trickle = setInterval(function () {
      if (settled) return;
      var room = 0.92 - target;
      if (room > 0.001) to(target + room * 0.02);
    }, 250);

    // Deliberately NOT window.load. The YouTube embed pulls in ~3s of
    // third-party player and ad script, and load waits for all of it — the
    // curtain would be hostage to it. What actually matters is: DOM parsed,
    // above-the-fold images decoded, webfonts settled.
    var domReady = new Promise(function (res) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', res, { once: true });
      } else { res(); }
    });

    var imagesReady = domReady.then(function () {
      clearInterval(creep);

      // Only images that actually gate first paint: lazy ones are, by
      // definition, not needed yet.
      var imgs = [].slice.call(document.images).filter(function (i) {
        return i.loading !== 'lazy' && !el.contains(i);
      });

      if (!imgs.length) { to(0.85); return; }

      var done = 0;
      return Promise.all(imgs.map(function (img) {
        return new Promise(function (res) {
          function step() {
            done++;
            to(0.25 + 0.60 * (done / imgs.length));
            res();
          }
          if (img.complete && img.naturalWidth) return step();
          img.addEventListener('load', step, { once: true });
          img.addEventListener('error', step, { once: true });   // never stall on a 404
        });
      }));
    });

    var fontsReady = (document.fonts && document.fonts.ready)
      ? document.fonts.ready
      : Promise.resolve();

    imagesReady.then(function () { return fontsReady; })
               .then(function () { to(0.95); return finish(); })
               .catch(finish);

    // A slow or broken asset must never leave a visitor stuck behind the curtain.
    setTimeout(finish, 5000);
  })();
</script>
<!-- preloader:end -->
`;
}

const STRIP = /[ \t]*<!-- preloader:start -->[\s\S]*?<!-- preloader:end -->\n?/g;

let changed = 0;
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(STRIP, '');

  const prefix = page.includes('/') ? '../' : '';

  if (!html.includes('</head>') || !/<body[^>]*>/.test(html)) {
    console.log('SKIP (no head/body):', page);
    continue;
  }

  html = html.replace('</head>', CSS + '</head>');
  html = html.replace(/(<body[^>]*>)/, '$1\n\n' + markup(prefix));

  fs.writeFileSync(file, html);
  console.log('injected:', page, prefix ? '(../ asset path)' : '');
  changed++;
}
console.log('\n' + changed + ' page(s) updated');
