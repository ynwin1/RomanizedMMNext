import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicSitemap } from "@/app/lib/public-sitemap";
import { songSeo } from "@/app/lib/song-seo";

test("sitemap has only canonical bilingual song links without lyric option duplicates", () => {
  const songs = [
    { mmid: 17, songName: "A Hnaung A Phweh (အနှောင်အဖွဲ့)" },
    { mmid: 19, songName: "Lost in Universe" },
  ];
  const routes = buildPublicSitemap(songs);
  assert.equal(routes.length, 16);
  assert.equal(new Set(routes.map(route => route.url)).size, routes.length);
  for (const song of songs) for (const locale of ["en", "my"]) {
    const canonical = songSeo({ ...song, artistName: [] }, locale).canonical;
    const row = routes.find(route => route.url === canonical);
    assert.ok(row, canonical);
    assert.deepEqual(row.alternates?.languages, songSeo({ ...song, artistName: [] }, locale).alternateLanguages);
  }
  assert.ok(routes.every(route => !route.url.includes("?")));
  assert.ok(routes.every(route => route.lastModified === undefined), "never invent modification timestamps");
});

test("sitemap is deterministic, deduplicates songs, and retains root pages on empty catalogue", () => {
  const empty = buildPublicSitemap([]);
  assert.equal(empty.length, 12);
  const repeated = buildPublicSitemap([{ mmid: 1, songName: "First Song" }, { mmid: 1, songName: "First Song" }, { mmid: -3, songName: "Invalid" }]);
  assert.equal(repeated.length, 14);
  assert.equal(repeated.filter(item => item.url.includes("/song/")).length, 2);
});

test("artist profiles appear exactly once per locale with matching language alternates", () => {
  const routes = buildPublicSitemap([], [{ slug: "example-artist" }, { slug: "example-artist" }, { slug: "" }, { slug: "myanmar-band" }]);
  assert.equal(routes.length, 16);
  const en = routes.find(route => route.url === "https://www.romanizedmm.com/en/artist/example-artist");
  assert.ok(en);
  assert.deepEqual(en.alternates?.languages, {
    en: "https://www.romanizedmm.com/en/artist/example-artist",
    my: "https://www.romanizedmm.com/my/artist/example-artist",
  });
  assert.equal(routes.filter(route => route.url.includes("/artist/example-artist")).length, 2);
  assert.ok(routes.every(route => !route.url.includes("?")));
});

test("song sitemap uses genuine update timestamps on each locale without inventing dates", () => {
  const when = new Date("2026-09-01T12:00:00.000Z");
  const routes = buildPublicSitemap([
    { mmid: 41, songName: "Song A", updatedAt: when },
    { mmid: 42, songName: "Song B" },
    { mmid: 43, songName: "Song C", updatedAt: new Date("invalid") },
    { mmid: 44, songName: "Song D", updatedAt: new Date("2999-01-01") },
  ]);
  const songs = routes.filter(row => row.url.includes("/song/"));
  assert.equal(songs.length, 8);
  assert.equal(songs.filter(row => row.url.includes("/SongA/")).length, 2);
  assert.ok(songs.filter(row => row.url.includes("/SongA/")).every(row => (row.lastModified as Date)?.getTime() === when.getTime()));
  assert.ok(songs.filter(row => !row.url.includes("/SongA/")).every(row => row.lastModified === undefined));
  assert.ok(routes.filter(row => !row.url.includes("/song/")).every(row => row.lastModified === undefined));
});
