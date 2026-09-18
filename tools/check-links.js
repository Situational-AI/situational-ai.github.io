// Crawls the built site in _site/ and fails on any local link, asset path or
// #anchor that does not resolve. Run after `npm run build`; CI runs it too.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "_site");
const pages = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) pages.push(full);
  }
})(ROOT);

const ids = new Map(); // page → Set of id="…"
const idsOf = (file) => {
  if (!ids.has(file)) {
    const html = fs.readFileSync(file, "utf8");
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
};

let checked = 0;
const problems = [];
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  // Strip comments so documentation snippets are not treated as links.
  const live = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const m of live.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(url)) continue;
    checked++;
    const [rawPath, hash] = url.split("#");
    const decoded = decodeURIComponent(rawPath.split("?")[0]);
    let target = !decoded ? page
      : decoded.startsWith("/") ? path.join(ROOT, decoded)          // site-root-relative
      : path.resolve(path.dirname(page), decoded);                   // page-relative
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target)) { problems.push(`${path.relative(ROOT, page)} → ${url} (missing)`); continue; }
    if (hash && target.endsWith(".html") && !idsOf(target).has(hash)) problems.push(`${path.relative(ROOT, page)} → ${url} (no #${hash})`);
  }
}

console.log(`${checked} local links across ${pages.length} pages`);
if (problems.length) { console.error(problems.map((p) => "  " + p).join("\n")); process.exit(1); }
console.log("all resolve");
