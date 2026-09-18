// Eleventy builds src/ into _site/, which GitHub Actions deploys to Pages.
//
// Pages keep their existing URLs: a source file src/research.html is served
// at /research.html, not /research/. That is what the sitemap, the share cards
// and every inbound link already use.
module.exports = function (eleventyConfig) {
  // Copied as-is (and never treated as templates — the READMEs in there are docs).
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.ignores.add("src/assets/**");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");

  // URL shape (.html kept) is set in src/_data/eleventyComputed.js.

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
