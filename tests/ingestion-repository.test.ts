import test from "node:test";
import assert from "node:assert/strict";
import Ingestion from "@/modules/ingestions/infrastructure/ingestion.model";
import { MongoIngestionRepository } from "@/modules/ingestions/infrastructure/ingestion.repository";
import { DuplicateIngestionError } from "@/modules/ingestions/application/ingestion-write.error";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const id = "507f1f77bcf86cd799439011";
const requestId = "507f191e810c19729de860ea";

type WriteModel = {
  create: (input: unknown) => Promise<{ toObject: () => unknown }>;
  findById: (id: string) => { lean: () => Promise<any> };
  findOne: (filter: unknown) => { lean: () => Promise<any> };
  findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => { lean: () => Promise<any> };
};
const model = Ingestion as unknown as WriteModel;

test("ingestion repository creates awaiting_source record with actor", async t => {
  t.mock.method(database, "default", async () => {});
  let input: unknown;
  t.mock.method(model, "create", async (value: unknown) => {
    input = value;
    return {
      toObject: () => ({ _id: id, songRequestId: requestId, status: "awaiting_source", updatedBy: "admin-1" }),
    };
  });

  const created = await new MongoIngestionRepository().create({ songRequestId: requestId }, "admin-1");
  assert.deepEqual(input, { songRequestId: requestId, status: "awaiting_source", updatedBy: "admin-1" });
  assert.equal(created.status, "awaiting_source");
  assert.equal(created.songRequestId, requestId);
});

test("ingestion repository maps duplicate request ingestion to domain error", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "create", async (_value: unknown) => { throw { code: 11000 }; });
  await assert.rejects(
    () => new MongoIngestionRepository().create({ songRequestId: requestId }),
    DuplicateIngestionError,
  );
});

test("ingestion repository finds the one ingestion for a request", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown;
  t.mock.method(model, "findOne", (value: unknown) => {
    filter = value;
    return { lean: async () => ({ _id: id, songRequestId: requestId, status: "awaiting_source", __v: 3 }) };
  });
  const found = await new MongoIngestionRepository().findByRequestId(requestId);
  assert.deepEqual(filter, { songRequestId: requestId });
  assert.equal(found?.id, id);
  assert.equal(found?.revision, 3);
});

test("ingestion transition is atomic on id, source status and revision", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, update: unknown, options: unknown;
  t.mock.method(model, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter = f; update = u; options = o;
    return { lean: async () => ({ _id: id, songRequestId: requestId, status: "ready_to_generate", __v: 1 }) };
  });

  await new MongoIngestionRepository().transition(
    id,
    0,
    "awaiting_source",
    "ready_to_generate",
    "admin-1",
  );

  assert.deepEqual(filter, {
    _id: id,
    status: "awaiting_source",
    $or: [{ __v: 0 }, { __v: { $exists: false } }],
  });
  assert.deepEqual(update, {
    $set: { status: "ready_to_generate", updatedBy: "admin-1" },
    $inc: { __v: 1 },
  });
  assert.deepEqual(options, { new: true, runValidators: true, upsert: false });
});

test("ingestion repository exposes revision when reading", async t => {
  t.mock.method(database, "default", async () => {});
  t.mock.method(model, "findById", (_id: string) => ({
    lean: async () => ({ _id: id, songRequestId: requestId, status: "generating", __v: 4 }),
  }));

  const found = await new MongoIngestionRepository().findById(id);
  assert.equal(found?.revision, 4);
  assert.equal(found?.status, "generating");
});
