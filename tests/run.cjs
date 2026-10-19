// node:test executes these serially in one process, including on Windows hosts
// where spawning test workers is restricted.
require("./security.test.cjs");
require("./media-cleanup.test.cjs");
require("./class-metrics.test.cjs");
require("./chat-dashboard.test.cjs");
