const Module = require("node:module");
const path = require("node:path");

const originalResolveFilename = Module._resolveFilename;
const root = path.resolve(__dirname, ".test-dist");

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(root, request.slice(2));
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
