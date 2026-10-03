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
const song = { id: "s1", mmid: 17, ...content };
function repository(overrides: Partial<ISongRepository> = {}): ISongRepository {
  return {
    create: async input => ({ id: "s1", ...input }), update: async () => song,
    findForEdit: async () => ({ ...song, revision: 0 }),
    findByMmid: async () => song, listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0, searchByTitle: async () => [], findRandom: async () => null,
    findLatest: async () => [], findByMmids: async () => [], listForSitemap: async () => [],
    listCatalogue: async () => [], listGuessLyricsSongs: async () => [], listGuessSongRecords: async () => [],
    findByArtistName: async () => [], ...overrides,
  };
}
function form() {
  const value = new FormData();
  for (const [key, text] of Object.entries(content)) if (typeof text === "string") value.set(key, text);
  value.set("mmid", "17");
  value.set("artistName", JSON.stringify(content.artistName));
  return value;
}

test("song validation preserves lyric whitespace and normalizes metadata", () => {
  const parsed = CreateSongSchema.parse({ ...content, mmid: "17", songName: "  Song  " });
  assert.equal(parsed.mmid, 17);
  assert.equal(parsed.songName, "Song");
  assert.equal(parsed.lyrics, content.lyrics);
});

test("song validation rejects missing content, unsafe URLs, malformed artists, and immutable fields", () => {
  for (const change of [
    { lyrics: "   " }, { artistName: [] }, { artistName: [{ name: "Artist" }] },
    { artistName: [{ name: "Artist", slug: "Invalid Slug" }] }, { imageLink: "javascript:alert(1)" },
    { youtubeLink: ["ftp://example.com"] }, { createdAt: new Date() }, { id: "injected" },
  ]) assert.equal(CreateSongSchema.safeParse({ ...content, mmid: 17, ...change }).success, false);
  assert.equal(SongContentSchema.safeParse({ ...content, mmid: 99 }).success, false);
  for (const mmid of [0, -1, 1.2, "bad", Infinity]) assert.equal(CreateSongSchema.safeParse({ ...content, mmid }).success, false);
});

test("form decoding handles blank optional fields, YouTube lines, and malformed artist input", () => {
  const value = form();
  value.set("albumName", "");
  value.set("youtubeLink", "https://youtu.be/a\r\n\n https://youtu.be/b ");
  const parsed = songFormInput(value, true);
  assert.equal(parsed.albumName, undefined);
  assert.deepEqual(parsed.youtubeLink, ["https://youtu.be/a", "https://youtu.be/b"]);
  assert.equal(parsed.lyrics, content.lyrics);
  assert.equal(songFormInput(value, false).mmid, undefined);
  value.set("artistName", "{");
  assert.equal(songFormInput(value, true).artistName, null);
});

test("song service validates before write and delegates validated full content", async () => {
  let received: unknown;
  const service = new SongService(repository({ create: async input => { received = input; return { id: "s1", ...input }; } }));
  await assert.rejects(() => service.createSong({ ...content, mmid: 0 }));
  assert.equal(received, undefined);
  assert.equal((await service.createSong({ ...content, mmid: "17" })).mmid, 17);
  assert.deepEqual(received, { ...content, mmid: 17 });
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
      authorize: async () => { calls.push("auth"); },
      songs: { createSong: async () => { calls.push("write"); return song; }, updateSong: async (id, revision, input) => {
        assert.equal(id, 17); assert.equal(revision, 2); assert.equal((input as Record<string, unknown>).mmid, undefined);
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
      authorize: async () => {}, songs: { createSong: async () => { throw error; }, updateSong: async () => { throw error; } },
      saved: () => { saved = true; throw new Error("redirect"); }, logFailure: () => {},
    });
    const result = await handler.create({}, form());
    assert.equal(saved, false);
    assert.doesNotMatch(result.message ?? "", /secret/);
    if (!(error.constructor === Error)) assert.equal(result.message, error.message);
  }
  const handler = createSongActionHandler({
    authorize: async () => {}, songs: new SongService(repository()),
    saved: () => { throw new Error("unexpected redirect"); }, logFailure: () => {},
  });
  const invalid = form(); invalid.set("songName", "");
  const result = await handler.create({}, invalid);
  assert.ok(result.errors?.songName.length);
});
