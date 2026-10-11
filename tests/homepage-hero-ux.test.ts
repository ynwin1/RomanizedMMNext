import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const home = readFileSync("app/(pages)/[locale]/(home)/page.tsx", "utf8");

test("homepage hero preserves search and locale-aware discovery links", () => {
  assert.match(home, /<h1 id="homepage-heading"/);
  assert.match(home, /<SearchBar \/>/);
  assert.match(home, /href={`\/\$\{locale\}\/song-catalogue`}/);
  assert.match(home, /href={`\/\$\{locale\}\/artist-catalogue`}/);
  assert.match(home, /aria-label="Explore Myanmar music"/);
});
test("homepage uses a contained video component without duplicate footer", () => {
  assert.doesNotMatch(home, /<Footer|fixed inset-0/);
  assert.match(home, /<HomeVideo \/>/);
  assert.match(home, /<Navbar \/>/);
  assert.match(home, /bg-background/);
});
