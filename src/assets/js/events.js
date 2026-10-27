// ============================================
// Situational AI — Event runtime
// ============================================
// The event's mode and RSVP URL live in src/_data/events.json and are
// rendered by the build, so the served page is already correct — no flash,
// and it works with JavaScript off. This file only drives the floating
// pill and the permit print button.

// Floating RSVP: shown once the page's own RSVP (data-rsvp-inflow) has
// scrolled out of view, so exactly one RSVP is on screen at a time.
// Dismissing it lasts for the browser session.
(function () {
  function init() {
    var float = document.querySelector('[data-rsvp-float]');
    if (!float) return;
    var KEY = 'sai-rsvp-dismissed';
    try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
    var inflow = document.querySelector('[data-rsvp-inflow]');

    function show() { float.hidden = false; requestAnimationFrame(function () { float.classList.add('is-visible'); }); }
    function hide() { float.classList.remove('is-visible'); }

    float.querySelector('.rsvp-float-close').addEventListener('click', function () {
      hide(); float.hidden = true;
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    });

    var hero = document.querySelector('[data-rsvp-hero]');
    if (float.hasAttribute('data-rsvp-always')) {
      // Always floating; glass while it sits over the dark hero, ink below it.
      show();
      if (hero && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          float.classList.toggle('rsvp-float--glass', entries[0].isIntersecting);
        }, { threshold: 0, rootMargin: '0px 0px -60px 0px' }).observe(hero);
      }
    } else if (inflow && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? hide() : show();
      }, { threshold: 0 }).observe(inflow);
    } else {
      show();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

// "Print permit": the PDF is same-origin, so load it in a hidden frame and
// send that frame to the printer. Browsers that refuse to print a framed PDF
// fall back to opening it in a new tab, where the viewer's own print works.
(function () {
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('[data-print-permit]');
    if (!link) return;
    e.preventDefault();
    var frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    frame.src = link.href;
    var opened = false;
    function fallback() { if (!opened) { opened = true; window.open(link.href, '_blank', 'noopener'); } }
    frame.onload = function () {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        opened = true;
      } catch (err) { fallback(); }
    };
    frame.onerror = fallback;
    document.body.appendChild(frame);
    // If the frame never loads (blocked plugin, slow network), open the tab.
    setTimeout(fallback, 3000);
  });
})();
