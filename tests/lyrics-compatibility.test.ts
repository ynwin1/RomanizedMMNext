import test from "node:test";
import assert from "node:assert/strict";
import { getCanonicalLyrics, legacyLyricsFromV2, withCanonicalLyrics } from "@/modules/songs/domain/lyrics.compatibility";
import type { SongEntity } from "@/modules/songs/domain/song.types";

const baseSong: SongEntity = {
  id: "song-1",
  mmid: 17,
  songName: "Song",
  artistName: [{ name: "Artist" }],
  genre: "Pop",
  about: "About",
  whenToListen: "Anytime",
  lyrics: "legacy lyrics",
  burmese: "legacy burmese",
  romanized: "legacy romanized",
  meaning: "legacy meaning",
};

test("canonical lyrics fall back to legacy text when lyricsV2 is absent", () => {
  assert.deepEqual(getCanonicalLyrics(baseSong), {
    burmese: "legacy burmese",
    romanized: "legacy romanized",
    meaning: "legacy meaning",
    source: "legacy",
  });
});

test("canonical lyrics prefer lyricsV2 and preserve aligned breaks", () => {
  const song: SongEntity = {
    ...baseSong,
    lyricsV2: {
      version: 2,
      entries: [
        {
          kind: "line",
          burmese: "ပထမ",
          romanized: "pa hta ma",
          meaning: "First",
        },
        { kind: "break" },
        {
          kind: "line",
          burmese: "ဒုတိယ",
          romanized: "du ti ya",
          meaning: null,
        },
      ],
    },
  };

  assert.deepEqual(getCanonicalLyrics(song), {
    burmese: "ပထမ\n\nဒုတိယ",
    romanized: "pa hta ma\n\ndu ti ya",
    meaning: "First\n\n",
    source: "v2",
  });
});

test("withCanonicalLyrics keeps the song shape while replacing only display lyric strings", () => {
  const song: SongEntity = {
    ...baseSong,
    lyricsV2: {
      version: 2,
      entries: [{
        kind: "line",
        burmese: "အသစ်",
        romanized: "a thit",
        meaning: "New",
      }],
    },
  };

  const canonical = withCanonicalLyrics(song);
  assert.equal(canonical.songName, song.songName);
  assert.equal(canonical.lyrics, "legacy lyrics");
  assert.equal(canonical.burmese, "အသစ်");
  assert.equal(canonical.romanized, "a thit");
  assert.equal(canonical.meaning, "New");
  assert.deepEqual(canonical.lyricsV2, song.lyricsV2);
});


test("legacy compatibility fields are deterministically derived from lyricsV2", () => {
  const lyricsV2 = {
    version: 2 as const,
    entries: [
      { kind: "line" as const, burmese: "တစ်", romanized: "tit", meaning: "One" },
      { kind: "break" as const },
      { kind: "line" as const, burmese: "နှစ်", romanized: "hnit", meaning: null },
    ],
  };

  assert.deepEqual(legacyLyricsFromV2(lyricsV2), {
    lyrics: "တစ်\n\nနှစ်",
    burmese: "တစ်\n\nနှစ်",
    romanized: "tit\n\nhnit",
    meaning: "One\n\n",
  });
});
