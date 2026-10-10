import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const page = readFileSync("app/(pages)/[locale]/(home)/page.tsx", "utf8");
const video = readFileSync("app/components/home/HomeVideo.tsx", "utf8");

test("homepage restores original identity, video, search and discoverability", () => {
  assert.match(page, /Sing Myanmar, Globally!/);
  assert.match(page, /<HomeVideo \/>/);
  assert.match(page, /<SearchBar \/>/);
  assert.match(page, /song-catalogue/);
  assert.match(page, /artist-catalogue/);
  assert.doesNotMatch(page, /Every song|rounded-full|rotate-3|rotate-6/);
});
test("video respects reduced-motion preference and retains accessible fallback", () => {
  assert.match(video, /RMBG\.mp4/);
  assert.match(video, /prefers-reduced-motion: reduce/);
  assert.match(video, /video.pause\(\)/);
  assert.match(video, /muted loop playsInline/);
  assert.match(video, /preload="metadata"/);
});
