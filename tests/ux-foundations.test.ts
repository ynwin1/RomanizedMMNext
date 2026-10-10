import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("global shell supports keyboard skip navigation to a real target", () => {
  const shell = readFileSync("app/(pages)/[locale]/layout.tsx", "utf8");
  assert.match(shell, /href="#main-content"/);
  assert.match(shell, /id="main-content"/);
  assert.match(shell, /tabIndex={-1}/);
});

test("design foundations support visible focus and reduced motion", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /:focus-visible/);
  assert.match(css, /\.skip-to-content:focus/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /--surface-raised:/);
});
