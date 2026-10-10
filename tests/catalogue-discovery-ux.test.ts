import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("song catalogue has responsive cards with a single primary link", () => {
  const card = readFileSync("app/components/catalogue/SongCard.tsx", "utf8");
  const page = readFileSync("app/(pages)/[locale]/(songs)/song-catalogue/page.tsx", "utf8");
  assert.match(card, /<Link href={songURL}/);
  assert.doesNotMatch(card, /<button/);
  assert.match(card, /song.artistName.map\(artist => artist.name\).join/);
  assert.match(page, /grid-cols-2/);
  assert.match(page, /Math.min\(100, Math.max\(1,/);
});
test("artist discovery is accessible and does not require profile biographies", () => {
  const card = readFileSync("app/components/catalogue/ArtistCard.tsx", "utf8");
  assert.match(card, /aria-expanded={expanded}/);
  assert.match(card, /<Link href={`\/\$\{locale\}\/artist\/\$\{artist.slug\}`}/);
  assert.match(card, /songs.length \?/);
  assert.doesNotMatch(card, /bg-gradient/);
});
