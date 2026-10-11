import test from "node:test";
import assert from "node:assert/strict";
import {filterCatalogueSongs, normalizeCatalogueQuery} from "../app/components/catalogue/catalogue-filter";
import {readFileSync} from "node:fs";

const songs = [
  {songName: "A Song (သီချင်းတစ်ပုဒ်)", artistName: [{name: "May Sweet"}], mmid: "1"},
  {songName: "Dreaming (အိပ်မက်)", artistName: [{name: "Lay Phyu"}, {name: "Iron Cross"}], mmid: "2"},
  {songName: "Golden Days", artistName: [{name: "Sai Htee Saing"}], mmid: "3"},
];

test("catalogue search matches romanized titles, Burmese titles, and any artist", () => {
  assert.deepEqual(filterCatalogueSongs(songs, "dream").map(song => song.mmid), ["2"]);
  assert.deepEqual(filterCatalogueSongs(songs, "သီချင်း").map(song => song.mmid), ["1"]);
  assert.deepEqual(filterCatalogueSongs(songs, "IRON CROSS").map(song => song.mmid), ["2"]);
  assert.deepEqual(filterCatalogueSongs(songs, " sweet ").map(song => song.mmid), ["1"]);
  assert.deepEqual(filterCatalogueSongs(songs, "nothing"), []);
  assert.equal(filterCatalogueSongs(songs, ""), songs);
  assert.equal(normalizeCatalogueQuery(`  ${"a".repeat(110)} `).length, 100);
});

test("catalogue search preserves page size and resets pagination", () => {
  const search = readFileSync("app/components/catalogue/CatalogueSearch.tsx", "utf8");
  const page = readFileSync("app/(pages)/[locale]/(songs)/song-catalogue/page.tsx", "utf8");
  const pagination = readFileSync("app/components/catalogue/Pagination.tsx", "utf8");
  assert.match(search, /new URLSearchParams\(searchParams.toString\(\)\)/);
  assert.match(search, /params.set\("page", "1"\)/);
  assert.match(search, /params.set\("q", normalized\)/);
  assert.match(search, /params.delete\("q"\)/);
  assert.match(page, /filterCatalogueSongs\(sortedSongs, query\)/);
  assert.match(page, /No songs found/);
  assert.match(pagination, /new URLSearchParams\(searchParams.toString\(\)\)/);
});

test("song cards preserve canonical links and show both title scripts when available", () => {
  const card = readFileSync("app/components/catalogue/SongCard.tsx", "utf8");
  assert.match(card, /<Link href={songURL}/);
  assert.match(card, /secondaryName && secondaryName !== displayName/);
  assert.match(card, /song.artistName.map\(artist => artist.name\).join/);
  assert.match(card, /bg-surface/);
});
