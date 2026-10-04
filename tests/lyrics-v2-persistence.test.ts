import test from "node:test";
import assert from "node:assert/strict";
import Song from "@/modules/songs/infrastructure/song.model";
import { MongoSongRepository } from "@/modules/songs/infrastructure/song.repository";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");

const legacyContent = {
  mmid: 17,
  songName: "Song",
  artistName: [{ name: "Artist", slug: "artist" }],
  genre: "Pop",
  about: "About",
  whenToListen: "Anytime",
  lyrics: "lyrics",
  romanized: "romanized",
  burmese: "burmese",
  meaning: "meaning",
};

const lyricsV2 = {
  version: 2 as const,
  entries: [
    {
      kind: "line" as const,
      burmese: "မင်းကို ချစ်တယ်။",
      romanized: "min ko chit tal.",
      meaning: "I love you.",
    },
    { kind: "break" as const },
    {
      kind: "line" as const,
      burmese: "Oh!",
      romanized: "Oh!",
      meaning: null,
    },
  ],
};

test("song model keeps lyricsV2 optional for legacy documents", async () => {
  const song = new Song(legacyContent);
  await song.validate();
  assert.equal(song.lyricsV2, undefined);
});

test("song model accepts the versioned lyricsV2 persistence shape", async () => {
  const song = new Song({ ...legacyContent, lyricsV2 });
  await song.validate();

  assert.equal(song.lyricsV2?.version, 2);
  assert.deepEqual(
    song.lyricsV2?.entries.map(entry => entry.kind === "break"
      ? { kind: "break" }
      : {
          kind: "line",
          burmese: entry.burmese,
          romanized: entry.romanized,
          meaning: entry.meaning,
        }),
    lyricsV2.entries,
  );
});

test("song model rejects unsupported lyrics versions", async () => {
  const song = new Song({
    ...legacyContent,
    lyricsV2: { ...lyricsV2, version: 3 },
  });
  await assert.rejects(() => song.validate());
});

test("song repository hydrates lyricsV2 while leaving legacy fields intact", async t => {
  t.mock.method(database, "default", async () => {});
  const model = Song as unknown as {
    findOne: (filter: unknown) => { lean: () => Promise<unknown> };
  };
  t.mock.method(model, "findOne", () => ({
    lean: async () => ({ _id: "song-1", ...legacyContent, lyricsV2 }),
  }));

  const song = await new MongoSongRepository().findByMmid(17);

  assert.equal(song?.burmese, "burmese");
  assert.equal(song?.romanized, "romanized");
  assert.equal(song?.meaning, "meaning");
  assert.deepEqual(song?.lyricsV2, lyricsV2);
});
