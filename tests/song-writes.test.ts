import test from "node:test";
import assert from "node:assert/strict";
import { CreateSongSchema, SongContentSchema } from "@/modules/songs/application/song.validation";
import { SongService } from "@/modules/songs/application/song.service";
import type { ISongRepository } from "@/modules/songs/application/song.repository";
import { SongConflictError, DuplicateSongError } from "@/modules/songs/application/song-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { songFormInput } from "@/app/admin/songs/song-form.data";
import { createSongActionHandler } from "@/app/admin/songs/song-action-handler";

const content = {
  songName: "Song", artistName: [{ name: "Artist", slug: "artist" }], genre: "Pop",
  about: "About", whenToListen: "Anytime", lyrics: " first line\nsecond line ",
  romanized: "romanized", burmese: "မြန်မာ", meaning: "meaning", isRequested: false,
};
const lyricsV2 = {
  version: 2 as const,
  entries: [
    {
      kind: "line" as const,
      burmese: "  မြန်မာစာ  ",
      romanized: "  myanmar sar  ",
      meaning: "  Burmese words  ",
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
const song = { id: "s1", mmid: 17, ...content };
function repository(overrides: Partial<ISongRepository> = {}): ISongRepository {
  return {
    create: async input => ({ id: "s1", ...input }),
    createPublished: async input => ({ id: "s1", ...input }),
    findBySourceIngestionId: async () => null,
    nextMmid: async () => 18,
    update: async () => song,
    findForEdit: async () => ({ ...song, revision: 0 }),
    findByMmid: async () => song, listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0, searchByTitle: async () => [], findRandom: async () => null,
    findLatest: async () => [], findByMmids: async () => [], listForSitemap: async () => [],
    listCatalogue: async () => [], listGuessLyricsSongs: async () => [], listGuessSongRecords: async () => [],
    findByArtistName: async () => [], listLyricsMigrationCandidates: async () => [], setLyricsV2IfAbsent: async () => true, setLyricsV2IfLegacyMatches: async () => ({ status: "saved" }), ...overrides,
  };
}
function form() {
  const value = new FormData();
  for (const [key, text] of Object.entries(content)) if (typeof text === "string") value.set(key, text);
  value.set("mmid", "17");
  value.set("artistName", JSON.stringify(content.artistName));
  value.set("lyricsV2", JSON.stringify(lyricsV2));
  return value;
}

test("song validation preserves lyric whitespace and normalizes metadata", () => {
  const parsed = CreateSongSchema.parse({ ...content, mmid: "17", songName: "  Song  " });
  assert.equal(parsed.mmid, 17);
  assert.equal(parsed.songName, "Song");
  assert.equal(parsed.lyrics, content.lyrics);
  assert.equal(CreateSongSchema.safeParse({
    ...content,
    mmid: 18,
    artistName: [{ name: "Name Only Artist" }],
  }).success, true);
});

test("song validation accepts and canonicalizes optional lyricsV2", () => {
  const parsed = CreateSongSchema.parse({ ...content, mmid: 17, lyricsV2 });
  assert.deepEqual(parsed.lyricsV2, {
    version: 2,
    entries: [
      {
        kind: "line",
        burmese: "မြန်မာစာ",
        romanized: "myanmar sar",
        meaning: "Burmese words",
      },
      { kind: "break" },
      {
        kind: "line",
        burmese: "Oh!",
        romanized: "Oh!",
        meaning: null,
      },
    ],
  });
  assert.equal(CreateSongSchema.safeParse({
    ...content,
    mmid: 17,
    lyricsV2: {
      version: 2,
      entries: [{ kind: "break" }],
    },
  }).success, false);
});

test("song validation rejects missing content, unsafe URLs, malformed artists, and immutable fields", () => {
  for (const change of [
    { lyrics: "   " }, { artistName: [] }, { artistName: [{ name: "" }] },
    { artistName: [{ name: "Artist", slug: "Invalid Slug" }] }, { imageLink: "javascript:alert(1)" },
    { youtubeLink: ["ftp://example.com"] }, { createdAt: new Date() }, { id: "injected" },
  ]) assert.equal(CreateSongSchema.safeParse({ ...content, mmid: 17, ...change }).success, false);
  assert.equal(SongContentSchema.safeParse({ ...content, mmid: 99 }).success, false);
  for (const mmid of [0, -1, 1.2, "bad", Infinity]) assert.equal(CreateSongSchema.safeParse({ ...content, mmid }).success, false);
});

test("admin form decoding requires lyricsV2 and derives legacy lyric compatibility fields from it", () => {
  const value = form();
  value.set("albumName", "");
  value.set("youtubeLink", "https://youtu.be/a\r\n\n https://youtu.be/b ");
  // Stale legacy fields must never win over V2.
  value.set("lyrics", "stale lyrics");
  value.set("burmese", "stale burmese");
  value.set("romanized", "stale romanized");
  value.set("meaning", "stale meaning");

  const parsed = songFormInput(value, true);
  assert.equal(parsed.albumName, undefined);
  assert.deepEqual(parsed.youtubeLink, ["https://youtu.be/a", "https://youtu.be/b"]);
  assert.deepEqual(parsed.lyricsV2, {
    version: 2,
    entries: [
      { kind: "line", burmese: "မြန်မာစာ", romanized: "myanmar sar", meaning: "Burmese words" },
      { kind: "break" },
      { kind: "line", burmese: "Oh!", romanized: "Oh!", meaning: null },
    ],
  });
  assert.equal(parsed.lyrics, "မြန်မာစာ\n\nOh!");
  assert.equal(parsed.burmese, "မြန်မာစာ\n\nOh!");
  assert.equal(parsed.romanized, "myanmar sar\n\nOh!");
  assert.equal(parsed.meaning, "Burmese words\n\n");
  assert.equal(songFormInput(value, false).mmid, undefined);

  value.delete("lyricsV2");
  assert.equal(songFormInput(value, true).lyricsV2, null);

  value.set("lyricsV2", "{");
  assert.equal(songFormInput(value, true).lyricsV2, null);

  value.set("artistName", "{");
  assert.equal(songFormInput(value, true).artistName, null);
});

test("song service validates before write and delegates validated full content", async () => {
  let received: unknown;
  let actor: string | undefined;
  const service = new SongService(repository({ create: async (input, updatedBy) => {
    received = input; actor = updatedBy; return { id: "s1", ...input };
  } }));
  await assert.rejects(() => service.createSong({ ...content, mmid: 0 }));
  assert.equal(received, undefined);
  assert.equal((await service.createSong({ ...content, mmid: "17" }, "admin-1")).mmid, 17);
  assert.deepEqual(received, { ...content, mmid: 17 });
  assert.equal(actor, "admin-1");
});

test("song service makes lyricsV2 authoritative for every write path", async () => {
  const received: unknown[] = [];
  const stale = {
    ...content,
    lyrics: "stale lyrics",
    burmese: "stale burmese",
    romanized: "stale romanized",
    meaning: "stale meaning",
    lyricsV2,
  };
  const service = new SongService(repository({
    create: async input => {
      received.push(input);
      return { id: "s1", ...input };
    },
    createPublished: async input => {
      received.push(input);
      return { id: "s2", ...input };
    },
    update: async (_mmid, _revision, input) => {
      received.push(input);
      return { ...song, ...input };
    },
  }));

  await service.createSong({ ...stale, mmid: 17 });
  await service.createPublishedSong({ ...stale, mmid: 18 }, "507f1f77bcf86cd799439011");
  await service.updateSong(17, 0, stale);

  for (const value of received as any[]) {
    assert.equal(value.lyrics, "မြန်မာစာ\n\nOh!");
    assert.equal(value.burmese, "မြန်မာစာ\n\nOh!");
    assert.equal(value.romanized, "myanmar sar\n\nOh!");
    assert.equal(value.meaning, "Burmese words\n\n");
  }
});

test("song service validates and delegates canonical lyricsV2 on create and update", async () => {
  const received: unknown[] = [];
  const service = new SongService(repository({
    create: async input => {
      received.push(input);
      return { id: "s1", ...input };
    },
    update: async (_mmid, _revision, input) => {
      received.push(input);
      return { ...song, ...input };
    },
  }));

  const created = await service.createSong({ ...content, mmid: 17, lyricsV2 });
  const updated = await service.updateSong(17, 0, { ...content, lyricsV2 });

  assert.deepEqual(created.lyricsV2, updated.lyricsV2);
  assert.deepEqual(created.lyricsV2?.entries[0], {
    kind: "line",
    burmese: "မြန်မာစာ",
    romanized: "myanmar sar",
    meaning: "Burmese words",
  });
  assert.equal(received.length, 2);

  await assert.rejects(() => service.updateSong(17, 0, {
    ...content,
    lyricsV2: { version: 2, entries: [{ kind: "break" }] },
  }));
  assert.equal(received.length, 2);
});

test("song update distinguishes a missing record from a stale revision", async () => {
  const stale = new SongService(repository({ update: async () => null }));
  await assert.rejects(() => stale.updateSong(17, 0, content), SongConflictError);
  const missing = new SongService(repository({ update: async () => null, findByMmid: async () => null }));
  await assert.rejects(() => missing.updateSong(17, 0, content), NotFoundError);
});

test("song edit reads and updates validate identifiers, revision, and immutable fields before access", async () => {
  let calls = 0;
  const service = new SongService(repository({
    update: async () => { calls++; return song; },
    findForEdit: async () => { calls++; return null; },
  }));
  await assert.rejects(() => service.getSongForEdit("bad"));
  await assert.rejects(() => service.updateSong(17, -1, content));
  await assert.rejects(() => service.updateSong(17, 0, { ...content, mmid: 99 }));
  assert.equal(calls, 0);
  await assert.rejects(() => service.getSongForEdit(17), NotFoundError);
});

test("both song actions authorize before writes and preserve authorization redirects", async () => {
  for (const mode of ["create", "update"] as const) {
    let writes = 0;
    const denied = new Error("auth redirect");
    const handler = createSongActionHandler({
      authorize: async () => { throw denied; },
      songs: { createSong: async () => { writes++; return song; }, updateSong: async () => { writes++; return song; } },
      saved: () => { throw new Error("unexpected redirect"); }, logFailure: () => {},
    });
    await assert.rejects(() => mode === "create" ? handler.create({}, form()) : handler.update(17, 0, {}, form()), error => error === denied);
    assert.equal(writes, 0);
  }
});

test("successful song actions invalidate/redirect only after persistence", async () => {
  for (const mode of ["create", "update"] as const) {
    const calls: string[] = [];
    const handler = createSongActionHandler({
      authorize: async () => { calls.push("auth"); return { userId: "admin-1" }; },
      songs: { createSong: async (_input, updatedBy) => { assert.equal(updatedBy, "admin-1"); calls.push("write"); return song; }, updateSong: async (id, revision, input, updatedBy) => {
        assert.equal(id, 17); assert.equal(revision, 2); assert.equal((input as Record<string, unknown>).mmid, undefined); assert.equal(updatedBy, "admin-1");
        calls.push("write"); return song;
      } },
      saved: id => { calls.push("saved:" + id); throw new Error("success redirect"); }, logFailure: () => {},
    });
    await assert.rejects(() => mode === "create" ? handler.create({}, form()) : handler.update(17, 2, {}, form()), /success redirect/);
    assert.deepEqual(calls, ["auth", "write", "saved:17"]);
  }
});

test("song action failures surface validation and conflicts without success redirects or internal leaks", async () => {
  for (const error of [new DuplicateSongError(), new SongConflictError(), new NotFoundError("Song not found"), new Error("mongodb://secret")]) {
    let saved = false;
    const handler = createSongActionHandler({
      authorize: async () => ({ userId: "admin-1" }), songs: { createSong: async () => { throw error; }, updateSong: async () => { throw error; } },
      saved: () => { saved = true; throw new Error("redirect"); }, logFailure: () => {},
    });
    const result = await handler.create({}, form());
    assert.equal(saved, false);
    assert.doesNotMatch(result.message ?? "", /secret/);
    if (!(error.constructor === Error)) assert.equal(result.message, error.message);
  }
  const handler = createSongActionHandler({
    authorize: async () => ({ userId: "admin-1" }), songs: new SongService(repository()),
    saved: () => { throw new Error("unexpected redirect"); }, logFailure: () => {},
  });
  const invalid = form(); invalid.set("songName", "");
  const result = await handler.create({}, invalid);
  assert.ok(result.errors?.songName.length);
});


test("song actions require valid lyricsV2 form JSON, derive legacy fields, and reject malformed or missing V2 before writes", async () => {
  let writes = 0;
  let received: unknown;
  const handler = createSongActionHandler({
    authorize: async () => ({ userId: "admin-1" }),
    songs: {
      createSong: async input => {
        writes++;
        received = input;
        return { id: "s1", ...(input as any) };
      },
      updateSong: async () => {
        writes++;
        return song;
      },
    },
    saved: () => { throw new Error("success redirect"); },
    logFailure: () => {},
  });

  const valid = form();
  valid.set("lyricsV2", JSON.stringify(lyricsV2));
  await assert.rejects(() => handler.create({}, valid), /success redirect/);
  assert.equal(writes, 1);
  assert.deepEqual((received as any).lyricsV2.entries[1], { kind: "break" });
  assert.equal((received as any).burmese, "မြန်မာစာ\n\nOh!");
  assert.equal((received as any).romanized, "myanmar sar\n\nOh!");
  assert.equal((received as any).meaning, "Burmese words\n\n");
  assert.equal((received as any).lyrics, "မြန်မာစာ\n\nOh!");

  const missing = form();
  missing.delete("lyricsV2");
  const missingResult = await handler.create({}, missing);
  assert.equal(writes, 1);
  assert.equal(missingResult.message, "Please correct the highlighted fields.");

  const invalid = form();
  invalid.set("lyricsV2", "{");
  const result = await handler.create({}, invalid);
  assert.equal(writes, 1);
  assert.equal(result.message, "Please correct the highlighted fields.");
});
