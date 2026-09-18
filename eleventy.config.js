// Eleventy builds src/ into _site/, which GitHub Actions deploys to Pages.
//
// Pages keep their existing URLs: a source file src/research.html is served
// at /research.html, not /research/. That is what the sitemap, the share cards
// and every inbound link already use.
const crypto = require("crypto");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  // Stylesheet links carry a content hash, so a CSS change is never served
  // from a visitor's cached copy (Pages caches for 10 minutes, browsers longer).
  const css = fs.readFileSync("src/assets/css/style.css");
  eleventyConfig.addGlobalData("cssVersion", crypto.createHash("md5").update(css).digest("hex").slice(0, 8));

  // Copied as-is (and never treated as templates — the READMEs in there are docs).
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.ignores.add("src/assets/**");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // URL shape (.html kept) is set in src/_data/eleventyComputed.js.

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
