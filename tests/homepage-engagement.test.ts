import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const home = readFileSync("app/(pages)/[locale]/(home)/page.tsx", "utf8");
test("homepage engagement features working localized routes and clear actions", () => {
  assert.match(home, /aria-labelledby="explore-more-heading"/);
  assert.match(home, /href={`\/\$\{locale\}\/game-modes`}/);
  assert.match(home, /href={`\/\$\{locale\}\/song-request`}/);
  assert.match(home, /href={`\/\$\{locale\}\/artist-catalogue`}/);
});
test("homepage continues to feature video, search and latest real songs", () => {
  assert.match(home, /<HomeVideo \/>/);
  assert.match(home, /<SearchBar \/>/);
  assert.match(home, /songService\.getLatestSongs\(6\)/);
  assert.doesNotMatch(home, /bg-blue-|bg-purple-/);
});
