const fs = require("fs");
const crypto = require("crypto");

module.exports = function (eleventyConfig) {
// Copia la cartella assets così com’è dentro _site
eleventyConfig.addPassthroughCopy({ "src/redirects": "/" });
eleventyConfig.addPassthroughCopy({ "src/service_worker.js": "service_worker.js" });
eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
eleventyConfig.addPassthroughCopy({ "src/assets/img/favicon.ico": "favicon.ico" });
eleventyConfig.addPassthroughCopy({ "src/assets/img/favicon-96x96.ico": "favicon-96x96.ico" });
eleventyConfig.addPassthroughCopy({ "src/assets/img/favicon-16x16.ico": "favicon-16x16.ico" });
eleventyConfig.addGlobalData("currentYear", () => {
    return new Date().getFullYear();
  });


// Watch extra (opzionale)
eleventyConfig.addWatchTarget("src/assets");
eleventyConfig.addWatchTarget("src/i18n");

// filtro per cache-busting basato su contenuto
eleventyConfig.addNunjucksFilter("rev", function (relPathFromRoot) {
  const path = `./_site/${relPathFromRoot.replace(/^\//, "")}`;
  try {
    const buf = fs.readFileSync(path);
    const hash = crypto.createHash("md5").update(buf).digest("hex").slice(0, 10);
    return `${relPathFromRoot}?v=${hash}`;
  } catch {
    // Se non esiste ancora (prima build) fai fallback a timestamp
    return `${relPathFromRoot}?v=${Date.now()}`;
  }
});

eleventyConfig.addNunjucksFilter("translate", function (key, lang) {
  const fs = require("fs");
  const path = require("path");
  const activeLang = lang || "en"; // fallback

  try {
    const i18nFile = path.join(__dirname, "src/i18n", `${activeLang}.json`);
    const i18n = JSON.parse(fs.readFileSync(i18nFile, "utf-8"));
    return i18n[key] || key;
  } catch (e) {
    return key;
  }
});

eleventyConfig.addNunjucksFilter("json", (obj) => JSON.stringify(obj));

return {
dir: {
input: "src",
includes: "partials",
layouts: "layouts",
data: "_data",
output: "_site",
},
markdownTemplateEngine: "njk",
htmlTemplateEngine: "njk",
dataTemplateEngine: "njk",
};
};
