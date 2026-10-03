import test from "node:test";
import assert from "node:assert/strict";
import SongRequest from "@/modules/requests/infrastructure/song-request.model";
import { MongoSongRequestRepository } from "@/modules/requests/infrastructure/song-request.repository";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const id = "507f1f77bcf86cd799439011";
type WriteModel = {
  findById: (id: string) => { lean: () => Promise<any> };
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => { lean: () => Promise<any> };
};
const model = SongRequest as unknown as WriteModel;

test("request detail maps legacy statuses and revision zero", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findById", () => ({ lean: async () => ({ _id: id, songName: "Song", artist: "Artist", status: "added" }) }));
  const detail = await new MongoSongRequestRepository().findAdminDetail(id);
  assert.equal(detail?.status, "completed");
  assert.equal(detail?.revision, 0);
});

test("request status update is atomic, validates, increments revision and never upserts", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, update: unknown, options: unknown;
  t.mock.method(model, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter=f; update=u; options=o;
    return { lean: async () => ({ _id: id, songName: "Song", artist: "Artist", status: "reviewing" }) };
  });
  const repo = new MongoSongRequestRepository();
  await repo.updateStatus(id, 2, "reviewing");
  assert.deepEqual(filter, { _id: id, __v: 2 });
  assert.deepEqual(update, { $set: { status: "reviewing" }, $inc: { __v: 1 } });
  assert.deepEqual(options, { new: true, runValidators: true, upsert: false });

  await repo.updateStatus(id, 0, "completed");
  assert.deepEqual(filter, { _id: id, $or: [{ __v: 0 }, { __v: { $exists: false } }] });
});

test("request status update returns null on optimistic miss", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findOneAndUpdate", () => ({ lean: async () => null }));
  assert.equal(await new MongoSongRequestRepository().updateStatus(id, 1, "rejected"), null);
});
