import test from "node:test";
import assert from "node:assert/strict";
import ContentDraft from "@/modules/content-drafts/infrastructure/content-draft.model";
import { MongoContentDraftRepository } from "@/modules/content-drafts/infrastructure/content-draft.repository";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const id = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";

type WriteModel = {
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => { lean: () => Promise<any> };
};
const model = ContentDraft as unknown as WriteModel;

test("draft metadata patch unsets explicitly cleared optional values", async t => {
  t.mock.method(database, "default", async () => {});
  let updateSeen: any;

  t.mock.method(model, "findOneAndUpdate", (_filter: unknown, update: unknown, _options: unknown) => {
    updateSeen = update;
    return {
      lean: async () => ({
        _id: id,
        ingestionId,
        identity: {},
        source: {},
        generated: {},
        metadata: { genre: "Pop" },
        artists: [],
        __v: 3,
      }),
    };
  });

  await new MongoContentDraftRepository().update(id, 2, {
    metadata: {
      genre: "Pop",
      albumName: null,
      spotifyLink: null,
      youtubeLinks: null,
    },
  }, "admin-1");

  assert.deepEqual(updateSeen, {
    $inc: { __v: 1 },
    $set: {
      "metadata.genre": "Pop",
      updatedBy: "admin-1",
    },
    $unset: {
      "metadata.albumName": 1,
      "metadata.spotifyLink": 1,
      "metadata.youtubeLinks": 1,
    },
  });
});
