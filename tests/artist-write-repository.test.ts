import test from "node:test";
import assert from "node:assert/strict";
import { ArtistType } from "@/modules/artists/domain/artist.types";
import Artist from "@/modules/artists/infrastructure/artist.model";
import { MongoArtistRepository } from "@/modules/artists/infrastructure/artist.repository";
import { DuplicateArtistError } from "@/modules/artists/application/artist-write.error";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const content = {
  name: "Artist",
  imageLink: "https://example.com/artist.jpg",
  type: ArtistType.Singer,
  musicGenre: ["Pop"],
  songs: [17],
};
type WriteModel = {
  create: (input: unknown) => Promise<unknown>;
  findOne: (filter: unknown) => { lean: () => Promise<unknown> };
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => { lean: () => Promise<unknown> };
};
const model = Artist as unknown as WriteModel;

test("artist repository create maps canonical entity and translates duplicate slugs", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "create", async (input: unknown) => ({
    toObject: () => ({ _id: "a1", likes: 0, ...(input as object) }),
  }));
  const repo = new MongoArtistRepository();
  const created = await repo.create({ slug: "artist", ...content }, "admin-1");
  assert.equal(created.id, "a1");
  assert.equal(created.slug, "artist");
  assert.equal(created.updatedBy, "admin-1");

  t.mock.method(model, "create", async () => { throw { code: 11000, keyPattern: { slug: 1 } }; });
  await assert.rejects(() => repo.create({ slug: "artist", ...content }), DuplicateArtistError);
});

test("artist repository does not disguise unrelated duplicate keys as duplicate slugs", async t => {
  t.mock.method(database, "default", async () => {});
  const error = { code: 11000, keyPattern: { name: 1 } };
  t.mock.method(model, "create", async () => { throw error; });
  await assert.rejects(() => new MongoArtistRepository().create({ slug: "artist", ...content }), value => value === error);
});

test("artist edit reads use revision zero for legacy records and return null when missing", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findOne", () => ({
    lean: async () => ({ _id: "a1", slug: "artist", likes: 0, ...content }),
  }));
  assert.equal((await new MongoArtistRepository().findForEdit("artist"))?.revision, 0);

  t.mock.method(model, "findOne", () => ({ lean: async () => null }));
  assert.equal(await new MongoArtistRepository().findForEdit("missing"), null);
});

test("artist update is atomic, validates, never upserts, clears optional fields and preserves slug/likes", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, update: unknown, options: unknown;
  t.mock.method(model, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter = f;
    update = u;
    options = o;
    return { lean: async () => ({ _id: "a1", slug: "artist", likes: 9, ...content }) };
  });

  const repo = new MongoArtistRepository();
  const saved = await repo.update("artist", 2, content, "admin-1");
  assert.equal(saved?.slug, "artist");
  assert.deepEqual(filter, { slug: "artist", __v: 2 });
  assert.deepEqual(options, { new: true, runValidators: true, upsert: false });

  const mutation = update as { $set: Record<string, unknown>; $unset: Record<string, number>; $inc: object };
  assert.deepEqual(mutation.$set, { ...content, updatedBy: "admin-1" });
  assert.equal(mutation.$unset.bannerLink, 1);
  assert.equal(mutation.$unset.socials, 1);
  assert.deepEqual(mutation.$inc, { __v: 1 });
  assert.equal(Object.hasOwn(mutation.$set, "slug"), false);
  assert.equal(Object.hasOwn(mutation.$set, "likes"), false);

  await repo.update("artist", 0, { ...content, bannerLink: "https://example.com/banner.jpg" });
  assert.deepEqual(filter, { slug: "artist", $or: [{ __v: 0 }, { __v: { $exists: false } }] });
  assert.equal((update as typeof mutation).$unset.bannerLink, undefined);
});

test("artist repository returns null when optimistic update does not match", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findOneAndUpdate", () => ({ lean: async () => null }));
  assert.equal(await new MongoArtistRepository().update("artist", 2, content), null);
});
