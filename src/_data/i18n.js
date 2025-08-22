const fs = require("fs");
const path = require("path");


module.exports = () => {
const dir = path.join(__dirname, "..", "i18n");
const out = {};
for (const file of fs.readdirSync(dir)) {
if (!file.endsWith(".json")) continue;
const lang = path.basename(file, ".json");
const raw = fs.readFileSync(path.join(dir, file), "utf8");
out[lang] = JSON.parse(raw);
}
return out;
};
