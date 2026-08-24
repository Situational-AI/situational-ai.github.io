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

  // --- Nav follows the dark zone ---
  // The dark run ends partway through .theme-fade; past that point the page
  // is light and the nav goes back to its white bar.
  const fade = document.querySelector('.theme-fade');
  if (navbar && fade) {
    const syncNavTheme = () => {
      // Switch just before the ramp reaches mid-grey, so the bar never sits
      // as a dark strip on an already-light background.
      const switchAt = fade.offsetTop + fade.offsetHeight * 0.45;
      navbar.classList.toggle('is-on-dark', window.scrollY + navbar.offsetHeight < switchAt);
    };
    window.addEventListener('scroll', syncNavTheme, { passive: true });
    window.addEventListener('resize', syncNavTheme);
    syncNavTheme();
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
