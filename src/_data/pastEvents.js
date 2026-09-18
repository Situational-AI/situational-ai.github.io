// Past events get generated pages (src/events/event.njk); custom ones keep their own.
const events = require("./events.json");
module.exports = events.filter((e) => e.status === "past" && !e.custom);
