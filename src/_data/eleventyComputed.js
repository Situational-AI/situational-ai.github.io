// Keep the .html filename rather than Eleventy's default /name/index.html, so
// src/research.html is served at /research.html — the URL the sitemap, the
// share cards and every inbound link already use. A page can still set its
// own permalink in front matter (or `permalink: false` to skip output).
module.exports = {
  permalink: (data) => {
    if (data.permalink === false) return false;
    if (data.permalink) return data.permalink;
    return `${data.page.filePathStem}.html`;
  },
};
