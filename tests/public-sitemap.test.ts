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
  assert.equal(routes.length, 12);
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
  assert.equal(empty.length, 8);
  const repeated = buildPublicSitemap([{ mmid: 1, songName: "First Song" }, { mmid: 1, songName: "First Song" }, { mmid: -3, songName: "Invalid" }]);
  assert.equal(repeated.length, 10);
  assert.equal(repeated.filter(item => item.url.includes("/song/")).length, 2);
});
