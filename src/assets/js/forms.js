// The site's own forms post into Google Forms through a hidden iframe, so the
// visitor never leaves the page. Google's confirmation loads in the iframe;
// that load event (after a submit) is the success signal — the response body
// itself is cross-origin and unreadable, which is fine.
document.querySelectorAll('form[data-google-form]').forEach((form) => {
  const frame = document.createElement('iframe');
  frame.name = 'gf-' + Math.random().toString(36).slice(2);
  frame.hidden = true;
  document.body.appendChild(frame);
  form.target = frame.name;

  let pending = false;
  form.addEventListener('submit', () => {
    pending = true;
    form.querySelector('[type="submit"]').disabled = true;
  });
  frame.addEventListener('load', () => {
    if (!pending) return;
    pending = false;
    const success = document.getElementById(form.dataset.success);
    form.hidden = true;
    if (success) { success.hidden = false; success.focus?.(); }
  });
});
