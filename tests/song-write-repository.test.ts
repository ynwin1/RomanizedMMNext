import test from "node:test";
import assert from "node:assert/strict";
import Song from "@/modules/songs/infrastructure/song.model";
import { MongoSongRepository } from "@/modules/songs/infrastructure/song.repository";
import {
  DuplicatePublishedSongError,
  DuplicateSongError,
} from "@/modules/songs/application/song-write.error";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const content = {
  songName: "Song", artistName: [{ name: "Artist", slug: "artist" }], genre: "Pop",
  about: "About", whenToListen: "Anytime", lyrics: "lyrics", romanized: "romanized",
  burmese: "burmese", meaning: "meaning", isRequested: false,
};
const lyricsV2 = {
  version: 2 as const,
  entries: [{
    kind: "line" as const,
    burmese: "မြန်မာ",
    romanized: "myanmar",
    meaning: "Myanmar",
  }],
};
type WriteModel = {
  create: (input: unknown) => Promise<unknown>;
  findOne: (filter: unknown) => {
    sort?: (sort: unknown) => {
      select: (select: string) => { lean: () => Promise<any> };
    };
    lean: () => Promise<any>;
  };
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => { lean: () => Promise<unknown> };
};
const model = Song as unknown as WriteModel;

test("song repository create maps the canonical entity and translates duplicate IDs", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "create", async (input: unknown) => ({ toObject: () => ({ _id: "s1", ...(input as object) }) }));
  const repo = new MongoSongRepository();
  const created = await repo.create({ mmid: 17, ...content }, "admin-1");
  assert.equal(created.id, "s1");
  assert.equal(created.mmid, 17);
  assert.equal(created.updatedBy, "admin-1");
  t.mock.method(model, "create", async () => { throw { code: 11000, keyPattern: { mmid: 1 } }; });
  await assert.rejects(() => repo.create({ mmid: 17, ...content }), DuplicateSongError);
});

test("song repository create persists lyricsV2 when application input includes it", async t => {
  t.mock.method(database, "default", async () => {});
  let received: any;
  t.mock.method(model, "create", async (input: unknown) => {
    received = input;
    return { toObject: () => ({ _id: "s1", ...(input as object) }) };
  });

  const created = await new MongoSongRepository().create({
    mmid: 17,
    ...content,
    lyricsV2,
  });

  assert.deepEqual(received.lyricsV2, lyricsV2);
  assert.deepEqual(created.lyricsV2, lyricsV2);
});

test("song repository does not disguise unrelated duplicate keys as duplicate song IDs", async t => {
  t.mock.method(database, "default", async () => {});
  const error = { code: 11000, keyPattern: { "artistName.slug": 1 } };
  t.mock.method(model, "create", async () => { throw error; });
  await assert.rejects(() => new MongoSongRepository().create({ mmid: 17, ...content }), value => value === error);
});

test("song edit reads return plain artist values, use revision zero for legacy records, and return null when missing", async t => {
  t.mock.method(database, "default", async () => {});
  const nestedPersistenceId = { toJSON: () => "should-not-cross-boundary" };
  t.mock.method(model, "findOne", () => ({
    lean: async () => ({
      _id: "s1",
      mmid: 17,
      ...content,
      artistName: [{
        name: "Artist",
        slug: "artist",
        _id: nestedPersistenceId,
      }],
    }),
  }));

  const editable = await new MongoSongRepository().findForEdit(17);
  assert.equal(editable?.revision, 0);
  assert.deepEqual(editable?.artistName, [{ name: "Artist", slug: "artist" }]);
  assert.equal(Object.hasOwn(editable?.artistName[0] ?? {}, "_id"), false);

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
  const saved = await repo.update(17, 2, content, "admin-1");
  assert.equal(saved?.mmid, 17);
  assert.deepEqual(filter, { mmid: 17, __v: 2 });
  assert.deepEqual(options, { new: true, runValidators: true, upsert: false });
  const mutation = update as { $set: Record<string, unknown>; $unset: Record<string, number>; $inc: object };
  assert.deepEqual(mutation.$set, { ...content, updatedBy: "admin-1" });
  assert.equal(mutation.$unset.imageLink, 1);
  assert.equal(mutation.$unset.songStoryMy, 1);
  assert.equal(mutation.$unset.lyricsV2, undefined);
  assert.equal(Object.hasOwn(mutation.$set, "lyricsV2"), false);
  assert.deepEqual(mutation.$inc, { __v: 1 });
  assert.equal(Object.hasOwn(mutation.$set, "mmid"), false);
  assert.equal(Object.hasOwn(mutation.$set, "createdAt"), false);
  await repo.update(17, 0, { ...content, imageLink: "https://example.com/a.jpg" });
  assert.deepEqual(filter, { mmid: 17, $or: [{ __v: 0 }, { __v: { $exists: false } }] });
  assert.equal((update as typeof mutation).$unset.imageLink, undefined);
});

test("song update writes lyricsV2 when supplied without requiring it for legacy edits", async t => {
  t.mock.method(database, "default", async () => {});
  let update: any;
  t.mock.method(model, "findOneAndUpdate", (_filter: unknown, mutation: unknown) => {
    update = mutation;
    return { lean: async () => ({ _id: "s1", mmid: 17, ...content, lyricsV2 }) };
  });

  const repo = new MongoSongRepository();
  await repo.update(17, 1, { ...content, lyricsV2 });
  assert.deepEqual(update.$set.lyricsV2, lyricsV2);

  await repo.update(17, 2, content);
  assert.equal(Object.hasOwn(update.$set, "lyricsV2"), false);
  assert.equal(Object.hasOwn(update.$unset ?? {}, "lyricsV2"), false);
});

test("song repository returns null when optimistic update does not match", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findOneAndUpdate", () => ({ lean: async () => null }));
  assert.equal(await new MongoSongRepository().update(17, 2, content), null);
});


test("published song persistence stamps source ingestion identity and maps duplicate source separately", async t => {
  t.mock.method(database, "default", async () => {});
  let inputSeen: any;
  t.mock.method(model, "create", async (input: unknown) => {
    inputSeen = input;
    return { toObject: () => ({ _id: "s1", ...(input as object) }) };
  });

  const repo = new MongoSongRepository();
  const created = await repo.createPublished(
    { mmid: 18, ...content, artistName: [{ name: "Name Only Artist" }] },
    "507f1f77bcf86cd799439011",
    "admin-1",
  );

  assert.equal(created.mmid, 18);
  assert.equal(inputSeen.sourceIngestionId, "507f1f77bcf86cd799439011");
  assert.equal(inputSeen.updatedBy, "admin-1");

  t.mock.method(model, "create", async () => {
    throw { code: 11000, keyPattern: { sourceIngestionId: 1 } };
  });
  await assert.rejects(
    () => repo.createPublished(
      { mmid: 18, ...content },
      "507f1f77bcf86cd799439011",
    ),
    DuplicatePublishedSongError,
  );
});

test("published song lookup and next MMID use internal provenance and highest canonical ID", async t => {
  t.mock.method(database, "default", async () => {});
  let filterSeen: unknown;
  t.mock.method(model, "findOne", (filter: unknown) => {
    filterSeen = filter;
    return {
      lean: async () => ({ _id: "s1", mmid: 18, ...content }),
      sort: () => ({
        select: () => ({
          lean: async () => ({ mmid: 199 }),
        }),
      }),
    };
  });

  const repo = new MongoSongRepository();
  const found = await repo.findBySourceIngestionId("507f1f77bcf86cd799439011");
  assert.equal(found?.mmid, 18);
  assert.deepEqual(filterSeen, { sourceIngestionId: "507f1f77bcf86cd799439011" });

  assert.equal(await repo.nextMmid(), 200);
});


test("low-risk migration atomically sets lyricsV2 only when absent", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown;
  let update: unknown;
  let options: unknown;
  t.mock.method(model, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter = f;
    update = u;
    options = o;
    return { lean: async () => ({ _id: "s1", mmid: 17, ...content, lyricsV2 }) };
  });

  const migrated = await new MongoSongRepository().setLyricsV2IfAbsent(17, lyricsV2, "admin-1");
  assert.equal(migrated, true);
  assert.deepEqual(filter, { mmid: 17, lyricsV2: { $exists: false } });
  assert.deepEqual(update, {
    $set: { lyricsV2, updatedBy: "admin-1" },
    $inc: { __v: 1 },
  });
  assert.deepEqual(options, { new: true, runValidators: true, upsert: false });

  t.mock.method(model, "findOneAndUpdate", () => ({ lean: async () => null }));
  assert.equal(await new MongoSongRepository().setLyricsV2IfAbsent(17, lyricsV2, "admin-1"), false);
});


test("reviewed Meaning migration writes only when the legacy snapshot still matches", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown;
  t.mock.method(model, "findOneAndUpdate", (f: unknown) => {
    filter = f;
    return { lean: async () => ({ _id: "s1", mmid: 17, ...content, lyricsV2 }) };
  });

  const expected = {
    burmese: content.burmese,
    romanized: content.romanized,
    meaning: content.meaning,
  };
  const repo = new MongoSongRepository();
  assert.deepEqual(
    await repo.setLyricsV2IfLegacyMatches(17, expected, lyricsV2, "admin-1"),
    { status: "saved" },
  );
  assert.deepEqual(filter, {
    mmid: 17,
    lyricsV2: { $exists: false },
    ...expected,
  });
});

test("reviewed Meaning migration distinguishes existing V2 from stale source", async t => {
  t.mock.method(database, "default", async () => {});
  const expected = { burmese: content.burmese, romanized: content.romanized, meaning: content.meaning };
  t.mock.method(model, "findOneAndUpdate", () => ({ lean: async () => null }));

  t.mock.method(model, "findOne", () => ({
    select: () => ({ lean: async () => ({ lyricsV2 }) }),
    lean: async () => ({ lyricsV2 }),
  }));
  const repo = new MongoSongRepository();
  assert.deepEqual(
    await repo.setLyricsV2IfLegacyMatches(17, expected, lyricsV2, "admin-1"),
    { status: "already_v2" },
  );

  t.mock.method(model, "findOne", () => ({
    select: () => ({ lean: async () => ({}) }),
    lean: async () => ({}),
  }));
  assert.deepEqual(
    await repo.setLyricsV2IfLegacyMatches(17, expected, lyricsV2, "admin-1"),
    { status: "stale" },
  );
});
