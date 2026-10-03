import test from "node:test";
import assert from "node:assert/strict";
import Song from "@/modules/songs/infrastructure/song.model";
import { MongoSongRepository } from "@/modules/songs/infrastructure/song.repository";
import { DuplicateSongError } from "@/modules/songs/application/song-write.error";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const content = {
  songName: "Song", artistName: [{ name: "Artist", slug: "artist" }], genre: "Pop",
  about: "About", whenToListen: "Anytime", lyrics: "lyrics", romanized: "romanized",
  burmese: "burmese", meaning: "meaning", isRequested: false,
};
type WriteModel = {
  create: (input: unknown) => Promise<unknown>;
  findOne: (filter: unknown) => { lean: () => Promise<unknown> };
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => { lean: () => Promise<unknown> };
};
const model = Song as unknown as WriteModel;

test("song repository create maps the canonical entity and translates duplicate IDs", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "create", async (input: unknown) => ({ toObject: () => ({ _id: "s1", ...(input as object) }) }));
  const repo = new MongoSongRepository();
  const created = await repo.create({ mmid: 17, ...content });
  assert.equal(created.id, "s1");
  assert.equal(created.mmid, 17);
  t.mock.method(model, "create", async () => { throw { code: 11000, keyPattern: { mmid: 1 } }; });
  await assert.rejects(() => repo.create({ mmid: 17, ...content }), DuplicateSongError);
});

test("song repository does not disguise unrelated duplicate keys as duplicate song IDs", async t => {
  t.mock.method(database, "default", async () => {});
  const error = { code: 11000, keyPattern: { "artistName.slug": 1 } };
  t.mock.method(model, "create", async () => { throw error; });
  await assert.rejects(() => new MongoSongRepository().create({ mmid: 17, ...content }), value => value === error);
});

test("song edit reads use revision zero for legacy records and return null for missing songs", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findOne", () => ({ lean: async () => ({ _id: "s1", mmid: 17, ...content }) }));
  assert.equal((await new MongoSongRepository().findForEdit(17))?.revision, 0);
  t.mock.method(model, "findOne", () => ({ lean: async () => null }));
  assert.equal(await new MongoSongRepository().findForEdit(99), null);
});

test("song update is atomic, never upserts, validates, clears optional fields and preserves canonical identity", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, update: unknown, options: unknown;
  t.mock.method(model, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter = f; update = u; options = o;
    return { lean: async () => ({ _id: "s1", mmid: 17, ...content }) };
  });
  const repo = new MongoSongRepository();
  const saved = await repo.update(17, 2, content);
  assert.equal(saved?.mmid, 17);
  assert.deepEqual(filter, { mmid: 17, __v: 2 });
  assert.deepEqual(options, { new: true, runValidators: true, upsert: false });
  const mutation = update as { $set: Record<string, unknown>; $unset: Record<string, number>; $inc: object };
  assert.deepEqual(mutation.$set, content);
  assert.equal(mutation.$unset.imageLink, 1);
  assert.equal(mutation.$unset.songStoryMy, 1);
  assert.deepEqual(mutation.$inc, { __v: 1 });
  assert.equal(Object.hasOwn(mutation.$set, "mmid"), false);
  assert.equal(Object.hasOwn(mutation.$set, "createdAt"), false);
  await repo.update(17, 0, { ...content, imageLink: "https://example.com/a.jpg" });
  assert.deepEqual(filter, { mmid: 17, $or: [{ __v: 0 }, { __v: { $exists: false } }] });
  assert.equal((update as typeof mutation).$unset.imageLink, undefined);
});

test("song repository returns null when optimistic update does not match", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findOneAndUpdate", () => ({ lean: async () => null }));
  assert.equal(await new MongoSongRepository().update(17, 2, content), null);
});
