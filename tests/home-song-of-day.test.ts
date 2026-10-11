import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { songOfTheDayId } from "@/app/components/home/song-of-day";
import type { SongCatalogueRecord } from "@/modules/songs/application/song.dto";

const songs: SongCatalogueRecord[] = Array.from({ length: 6 }, (_, index) => ({
  mmid: index + 1, songName: `Song ${index + 1}`, artistName: [],
}));

test("song of the day is stable for the same Myanmar calendar day", () => {
  const earlier = songOfTheDayId(songs, new Date("2026-10-10T18:00:00Z"));
  const later = songOfTheDayId(songs, new Date("2026-10-11T16:59:59Z"));
  assert.equal(earlier, later);
  assert.equal(songOfTheDayId([], new Date()), null);
});

test("shuffled daily rotation features every song before repeating", () => {
  const chosen = new Set<number>();
  for (let offset = 0; offset < songs.length; offset++) {
    chosen.add(songOfTheDayId([...songs].reverse(), new Date(Date.UTC(2026, 9, 11 + offset, 0)))!);
  }
  assert.equal(chosen.size, songs.length);
  assert.ok(songs.every(song => chosen.has(song.mmid)));
});

test("home links the two-line feature card to a song and retains the other sections", () => {
  const page = readFileSync("app/(pages)/[locale]/(home)/page.tsx", "utf8");
  const card = readFileSync("app/components/home/SongOfTheDay.tsx", "utf8");
  assert.match(page, /<SongOfTheDay song=\{featuredSong\}/);
  assert.ok(page.indexOf("<SongOfTheDay") > page.indexOf("latest-songs-heading"));
  assert.ok(page.indexOf("<SongOfTheDay") < page.indexOf("explore-more-heading"));
  assert.match(card, /line-clamp-2/);
  assert.match(card, /Discover this song/);
  assert.match(card, /<Link href=\{href\}/);
});
