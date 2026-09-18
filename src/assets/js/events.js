// ============================================
// Situational AI — Event configuration
// ============================================
// The single place to update an event's registration link and to switch its
// page from registration mode to archive mode once it has happened.
//
//   <html data-event="october-22-2026" data-event-mode="register">
//   <a data-rsvp="october-22-2026" href="…">RSVP</a>
//
// Loaded in <head> so the mode is applied before first paint: content marked
// .event-register-only / .event-archive-only never flashes the wrong state.

window.SAI_EVENTS = {
  'october-22-2026': {
    rsvpUrl: 'https://luma.com/7jhkvaz2',
    // 'register' until the event; 'archive' afterwards. Same URL either way.
    mode: 'register'
  }
};

(function () {
  var root = document.documentElement;
  var current = window.SAI_EVENTS[root.getAttribute('data-event')];
  if (current) root.setAttribute('data-event-mode', current.mode);

  function linkRsvps() {
    var links = document.querySelectorAll('[data-rsvp]');
    for (var i = 0; i < links.length; i++) {
      var ev = window.SAI_EVENTS[links[i].getAttribute('data-rsvp')];
      if (ev) links[i].href = ev.rsvpUrl;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', linkRsvps, { once: true });
  } else {
    linkRsvps();
  }
})();
