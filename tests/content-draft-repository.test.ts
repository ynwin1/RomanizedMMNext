import test from "node:test";
import assert from "node:assert/strict";
import ContentDraft from "@/modules/content-drafts/infrastructure/content-draft.model";
import { MongoContentDraftRepository } from "@/modules/content-drafts/infrastructure/content-draft.repository";
import { DuplicateContentDraftError } from "@/modules/content-drafts/application/content-draft-write.error";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const id = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";

type WriteModel = {
  create: (input: unknown) => Promise<{ toObject: () => any }>;
  findById: (id: string) => { lean: () => Promise<any> };
  findOne: (filter: unknown) => { lean: () => Promise<any> };
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => { lean: () => Promise<any> };
};
const model = ContentDraft as unknown as WriteModel;

test("draft repository creates one empty workspace per ingestion", async t => {
  t.mock.method(database, "default", async () => {});
  let input: unknown;
  t.mock.method(model, "create", async (value: unknown) => {
    input = value;
    return {
      toObject: () => ({
        _id: id,
        ingestionId,
        identity: {},
        source: {},
        generated: {},
        metadata: {},
        artists: [],
        updatedBy: "admin-1",
      }),
    };
  });

  const created = await new MongoContentDraftRepository().create({ ingestionId }, "admin-1");
  assert.deepEqual(input, {
    ingestionId,
    identity: {},
    source: {},
    generated: {},
    metadata: {},
    artists: [],
    updatedBy: "admin-1",
  });
  assert.equal(created.ingestionId, ingestionId);
});

test("draft repository maps duplicate ingestion to domain error", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "create", async (_input: unknown) => { throw { code: 11000 }; });
  await assert.rejects(
    () => new MongoContentDraftRepository().create({ ingestionId }),
    DuplicateContentDraftError,
  );
});

test("draft patch writes only supplied nested fields and increments revision", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, update: any, options: unknown;
  t.mock.method(model, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter = f; update = u; options = o;
    return {
      lean: async () => ({
        _id: id,
        ingestionId,
        identity: {},
        source: { burmeseLyrics: "မြန်မာစာ" },
        generated: { romanized: "Myanmar sar", meaning: "Burmese text" },
        metadata: {},
        artists: [],
      }),
    };
  });

  await new MongoContentDraftRepository().update(id, 2, {
    source: { burmeseLyrics: "မြန်မာစာ" },
    generated: { romanized: "Myanmar sar" },
  }, "admin-1");

  assert.deepEqual(filter, { _id: id, __v: 2 });
  assert.deepEqual(update, {
    $set: {
      "source.burmeseLyrics": "မြန်မာစာ",
      "generated.romanized": "Myanmar sar",
      updatedBy: "admin-1",
    },
    $inc: { __v: 1 },
  });
  assert.deepEqual(options, { new: true, runValidators: true, upsert: false });
  assert.equal("generated.meaning" in update.$set, false);
});

test("draft repository maps resolved artist ids to strings and exposes revision", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findById", (_id: string) => ({
    lean: async () => ({
      _id: id,
      ingestionId,
      identity: {},
      source: {},
      generated: {},
      metadata: {},
      artists: [{
        kind: "resolved",
        artistId: { toString: () => "507f191e810c19729de860eb" },
        name: "Artist",
        slug: "artist",
      }],
      __v: 4,
    }),
  }));

  const found = await new MongoContentDraftRepository().findById(id);
  assert.equal(found?.revision, 4);
  assert.deepEqual(found?.artists, [{
    kind: "resolved",
    artistId: "507f191e810c19729de860eb",
    name: "Artist",
    slug: "artist",
  }]);
});
