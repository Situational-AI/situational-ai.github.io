// ============================================
// Situational AI — Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // --- Mobile nav toggle ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // --- YouTube video loader ---
  const loadVideoBtn = document.getElementById('loadVideoBtn');
  const youtubeUrlInput = document.getElementById('youtubeUrl');
  const videoFrame = document.getElementById('videoFrame');
  const videoPlaceholder = document.getElementById('videoPlaceholder');

  function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function loadVideo(url) {
    const videoId = extractVideoId(url);
    if (videoId && videoFrame && videoPlaceholder) {
      videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      videoFrame.classList.remove('hidden');
      videoPlaceholder.style.display = 'none';
    }
  }

  if (loadVideoBtn && youtubeUrlInput) {
    loadVideoBtn.addEventListener('click', () => {
      loadVideo(youtubeUrlInput.value.trim());
    });
    youtubeUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loadVideo(youtubeUrlInput.value.trim());
    });
  }

  if (videoPlaceholder) {
    videoPlaceholder.addEventListener('click', () => {
      if (youtubeUrlInput && youtubeUrlInput.value.trim()) {
        loadVideo(youtubeUrlInput.value.trim());
      }
    });
  }

  // --- Scroll-triggered fade-in animations ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Apply fade-in to section elements
  document.querySelectorAll('.about-card, .feature-card, .blog-card, .blog-list-card').forEach(el => {
    el.classList.add('fade-in');
    fadeObserver.observe(el);
  });

  // --- Progressive reveal: cascade a group in rather than snapping it in ---
  const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calmMotion) {
    document.querySelectorAll('.about-grid, .features-grid, .blog-grid, .blog-list').forEach(group => {
      Array.from(group.children).forEach((el, i) => {
        // Capped so a long list still finishes promptly.
        el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
      });
    });
  }

  // --- About section: scroll-driven dark -> light theme bridge ---
  // Re-declares the same colour tokens .is-dark uses in style.css, but
  // interpolated by scroll position instead of hard-toggled. Progress 0
  // matches the dark Video section exactly (so About reads as its
  // continuation); progress 1 matches the light page exactly (so there's
  // no seam once Features is on screen). Only About's own tokens change —
  // neighbouring sections are untouched.
  const aboutEl = document.getElementById('about');
  const aboutDarkBound = document.getElementById('video');
  const aboutLightBound = document.getElementById('features');
  if (aboutEl && aboutDarkBound && aboutLightBound) {
    // [custom property, dark rgba, light rgba, group] — dark values copied
    // from .is-dark, light values copied from :root, both in style.css.
    // Group 'bg' rides the raw scroll progress across the whole section;
    // group 'fg' (text/ink) rides a narrow eased band around the midpoint
    // instead (see foregroundProgress below) — with both on the same
    // linear ramp, text and its background are mirror curves that land on
    // the same middling grey at the same instant, wiping out contrast for
    // a visible stretch. Crossing foreground quickly keeps that instant
    // brief rather than smeared across the section.
    const ABOUT_TOKENS = [
      ['--color-bg', [13, 16, 18, 1], [255, 255, 255, 1], 'bg'],
      ['--color-bg-alt', [20, 24, 27, 1], [247, 248, 249, 1], 'bg'],
      ['--color-canvas', [20, 24, 27, 1], [255, 255, 255, 1], 'bg'],
      ['--color-surface', [255, 255, 255, 0.05], [255, 255, 255, 1], 'bg'],
      ['--color-surface-solid', [20, 24, 27, 1], [255, 255, 255, 1], 'bg'],
      ['--color-surface-hover', [255, 255, 255, 0.08], [255, 255, 255, 1], 'bg'],
      ['--color-border', [255, 255, 255, 0.13], [220, 225, 230, 1], 'bg'],
      ['--color-border-strong', [255, 255, 255, 0.24], [193, 198, 203, 1], 'bg'],
      ['--color-text', [255, 255, 255, 1], [28, 31, 34, 1], 'fg'],
      ['--color-text-soft', [255, 255, 255, 0.84], [65, 70, 76, 1], 'fg'],
      ['--color-text-muted', [255, 255, 255, 0.62], [120, 127, 135, 1], 'fg'],
      ['--color-text-faint', [255, 255, 255, 0.44], [166, 172, 178, 1], 'fg'],
      ['--color-primary', [255, 255, 255, 1], [28, 31, 34, 1], 'fg'],
      ['--color-primary-light', [255, 255, 255, 0.82], [65, 70, 76, 1], 'fg'],
      ['--color-primary-deep', [255, 255, 255, 1], [0, 0, 0, 1], 'fg'],
      // The tag pill stays white-tinted in both themes, just at a
      // different opacity, so it can't be derived from --color-text.
      ['--about-tag-bg', [255, 255, 255, 0.06], [255, 255, 255, 0.8], 'bg'],
      ['--about-tag-border', [255, 255, 255, 0.18], [28, 31, 34, 0.2], 'fg'],
    ];

    const lerp = (a, b, t) => a + (b - a) * t;
    const smoothstep = (x) => x * x * (3 - 2 * x);
    // Foreground crosses over inside a narrow window centred on the
    // section's midpoint — pinned white before it, pinned ink after.
    const FG_BAND_START = 0.49;
    const FG_BAND_END = 0.51;
    const foregroundProgress = (t) => {
      if (t <= FG_BAND_START) return 0;
      if (t >= FG_BAND_END) return 1;
      return smoothstep((t - FG_BAND_START) / (FG_BAND_END - FG_BAND_START));
    };

    const applyAboutProgress = (t) => {
      const fgT = foregroundProgress(t);
      ABOUT_TOKENS.forEach(([name, dark, light, group]) => {
        const gt = group === 'fg' ? fgT : t;
        const r = Math.round(lerp(dark[0], light[0], gt));
        const g = Math.round(lerp(dark[1], light[1], gt));
        const b = Math.round(lerp(dark[2], light[2], gt));
        const a = lerp(dark[3], light[3], gt);
        aboutEl.style.setProperty(name, `rgba(${r}, ${g}, ${b}, ${a})`);
      });
    };

    const syncAboutTheme = () => {
      // Tracks the viewport's top edge across About's own height: t=0 the
      // instant Video's bottom edge (About's top) reaches it, t=1 the
      // instant Features' top edge (About's bottom) reaches it. Tying it to
      // About's own span — rather than the viewport height — keeps the
      // ramp meaningful even when About is shorter than the viewport.
      const start = aboutDarkBound.offsetTop + aboutDarkBound.offsetHeight;
      const end = Math.max(aboutLightBound.offsetTop, start + 1);
      let t = (window.scrollY - start) / (end - start);
      t = Math.min(1, Math.max(0, t));

      // The fixed navbar always sits over whatever is at the current
      // scroll position, so its own dark/light bar tracks this same t —
      // dark while the section behind it still reads darker than not
      // (t < 0.5), including the whole Hero/Video run above where t is
      // clamped to 0. Without this the bar would only flip once it drifts
      // out of sync with what's actually behind it.
      if (navbar) navbar.classList.toggle('is-on-dark', t < 0.5);

      // Reduced motion: swap once instead of continuously animating with scroll.
      if (calmMotion) t = t < 0.5 ? 0 : 1;
      applyAboutProgress(t);
    };

    window.addEventListener('scroll', syncAboutTheme, { passive: true });
    window.addEventListener('resize', syncAboutTheme);
    syncAboutTheme();
  }

  // --- Hero background video ---
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    if (calmMotion) {
      // Honour the preference: hold the poster frame instead of looping.
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else {
      // Autoplay can still be refused (battery saver, iOS low-power, policy).
      // The poster stays visible either way, so failure is silent, not broken.
      const attempt = heroVideo.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => heroVideo.classList.add('is-paused'));
      }
    }
  }

  // --- Progressive images: resolve the blur once the real file decodes ---
  document.querySelectorAll('img.sai-progressive').forEach(img => {
    const reveal = () => img.classList.add('is-loaded');
    // Already decoded (cache, or beat this script) — no transition needed.
    if (img.complete && img.naturalWidth) {
      reveal();
      return;
    }
    img.addEventListener('load', reveal, { once: true });
    // On failure, drop the blur too: a sharp placeholder beats a permanently
    // smeared one that looks like a rendering bug.
    img.addEventListener('error', reveal, { once: true });
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
