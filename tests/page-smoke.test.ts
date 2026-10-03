import test from "node:test";
import assert from "node:assert/strict";

import { songService } from "@/modules/songs";
import { artistService } from "@/modules/artists";
import { generateMetadata as generateSongMetadata } from "@/app/(pages)/[locale]/(songs)/song/[name]/[id]/page";
import { generateMetadata as generateArtistMetadata } from "@/app/(pages)/[locale]/(artists)/artist/[slug]/page";
import { loadArtistCatalogueSongs } from "@/app/(pages)/[locale]/(artists)/artist-catalogue/artist-catalogue.data";

test("song page smoke: metadata renders from SongService data", async (t) => {
  t.mock.method(songService, "getByMmid", async () => ({
    id: "song-17",
    mmid: 17,
    songName: "Test Song (စမ်းသပ်သီချင်း)",
    artistName: [{ name: "Test Artist", slug: "test-artist" }],
    albumName: "Test Album",
    genre: "Pop",
    imageLink: "https://example.com/song.jpg",
    about: "About the song",
    whenToListen: "Anytime",
    lyrics: "lyrics",
    romanized: "romanized",
    burmese: "မြန်မာစာ lyrics long enough for metadata description generation",
    meaning: "meaning",
  }));

  const metadata = await generateSongMetadata(
    {
      params: Promise.resolve({ locale: "en", id: "17", name: "TestSong" }),
      searchParams: Promise.resolve({}),
    },
    undefined as never,
  );

  assert.match(String(metadata.title), /Test Song Lyrics/);
  assert.equal(
    metadata.alternates?.canonical,
    "https://www.romanizedmm.com/en/song/TestSong/17",
  );
});

test("artist page smoke: metadata renders from ArtistService data", async (t) => {
  t.mock.method(artistService, "getBySlug", async () => ({
    id: "artist-1",
    name: "Test Artist",
    slug: "test-artist",
    imageLink: "https://example.com/artist.jpg",
    biography: "A test biography",
    type: "solo",
    musicGenre: ["Pop"],
    songs: [17],
    likes: 0,
  }));

  const metadata = await generateArtistMetadata({
    params: Promise.resolve({ locale: "en", slug: "test-artist" }),
    searchParams: Promise.resolve({}),
  });

  assert.equal(metadata.title, "Test Artist");
  assert.equal(
    metadata.alternates?.canonical,
    "https://www.romanizedmm.com/en/artist/test-artist",
  );
});


test("artist catalogue batches unique song ids into one service call", async (t) => {
  const calls: number[][] = [];
  const songs = [{
    id: "song-17",
    mmid: 17,
    songName: "Song",
    artistName: [{ name: "Artist" }],
    genre: "Pop",
    about: "About",
    whenToListen: "Anytime",
    lyrics: "lyrics",
    romanized: "romanized",
    burmese: "burmese",
    meaning: "meaning",
  }];

  t.mock.method(songService, "getSongsByMmids", async (mmids: number[]) => {
    calls.push(mmids);
    return songs;
  });

  const result = await loadArtistCatalogueSongs([
    { songs: [17, 22] },
    { songs: [22, 31] },
  ]);

  assert.deepEqual(calls, [[17, 22, 31]]);
  assert.deepEqual(result, songs);
});

test("artist catalogue skips song lookup when the page has no songs", async (t) => {
  let calls = 0;

  t.mock.method(songService, "getSongsByMmids", async () => {
    calls += 1;
    return [];
  });

  const result = await loadArtistCatalogueSongs([
    { songs: [] },
    { songs: [] },
  ]);

  assert.deepEqual(result, []);
  assert.equal(calls, 0);
});
