import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("playback links use accessible controls and safe external navigation", () => {
  const source = readFileSync("app/components/music-box/ExtLinks.tsx", "utf8");
  assert.match(source, /aria-pressed={playerVisible}/);
  assert.match(source, /aria-label={playerVisible \?/);
  assert.match(source, /rel="noopener noreferrer"/);
  assert.match(source, /hasYoutube && playerVisible/);
  assert.doesNotMatch(source, /window.open|border-white/);
});
test("related songs reuse the site palette, make complete cards accessible links", () => {
  const card = readFileSync("app/components/artist/SongCard.tsx", "utf8");
  const more = readFileSync("app/components/music-box/MoreSongs.tsx", "utf8");
  assert.match(card, /<Link href={`/);
  assert.doesNotMatch(card, /<button|bg-blue-|bg-slate-/);
  assert.match(more, /grid-cols-1 gap-3 sm:grid-cols-2/);
  assert.match(more, /temporarily unavailable/);
});
