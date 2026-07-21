/**
 * Node/tsx scripts and tests import SQLite modules that declare `server-only`.
 * Next.js resolves `server-only` to a no-op under the react-server condition;
 * plain Node resolves the throwing stub. This preload makes Node treat it as a no-op.
 */
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function mockServerOnly(request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};
