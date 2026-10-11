import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const home = readFileSync("app/(pages)/[locale]/(home)/page.tsx", "utf8");

test("homepage shows real recent songs from the existing song service", () => {
  assert.match(home, /songService\.getLatestSongs\(6\)/);
  assert.match(home, /export const dynamic = "force-dynamic"/);
  assert.match(home, /recentSongs\.map\(song =>/);
  assert.match(home, /<SongCard key={song\.mmid}/);
  assert.match(home, /song\.imageLink \?\? ""/);
  assert.match(home, /recentSongs\.length > 0/);
});
test("discovery section keeps original video hero and catalogue navigation", () => {
  assert.match(home, /<HomeVideo \/>/);
  assert.match(home, /<SearchBar \/>/);
  assert.match(home, /aria-labelledby="latest-songs-heading"/);
  assert.match(home, /href={`\/\$\{locale\}\/song-catalogue`}/);
  assert.match(home, /href={`\/\$\{locale\}\/artist-catalogue`}/);
});
