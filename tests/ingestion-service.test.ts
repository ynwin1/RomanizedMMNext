import test from "node:test";
import assert from "node:assert/strict";
import { IngestionService } from "@/modules/ingestions/application/ingestion.service";
import type { IIngestionRepository } from "@/modules/ingestions/application/ingestion.repository";
import type { IngestionRecord } from "@/modules/ingestions/domain/ingestion.types";
import { IngestionConflictError, InvalidIngestionTransitionError } from "@/modules/ingestions/application/ingestion-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";

const id = "507f1f77bcf86cd799439011";
const requestId = "507f191e810c19729de860ea";

function record(overrides: Partial<IngestionRecord> = {}): IngestionRecord {
  return {
    id,
    songRequestId: requestId,
    status: "awaiting_source",
    revision: 0,
    ...overrides,
  };
}

function repository(overrides: Partial<IIngestionRepository> = {}): IIngestionRepository {
  return {
    create: async (input, updatedBy) => ({ ...record(), songRequestId: input.songRequestId, updatedBy }),
    findById: async () => record(),
    findByRequestId: async () => record(),
    transition: async (_id, _revision, _from, to, updatedBy) => ({ ...record(), status: to, updatedBy }),
    ...overrides,
  };
}

test("ingestion creation validates request id and starts in awaiting_source", async () => {
  let calls = 0;
  const service = new IngestionService(repository({
    create: async (input, updatedBy) => {
      calls++;
      assert.equal(input.songRequestId, requestId);
      assert.equal(updatedBy, "admin-1");
      return { ...record(), updatedBy };
    },
  }));

  await assert.rejects(() => service.createForRequest("bad", "admin-1"));
  assert.equal(calls, 0);
  const created = await service.createForRequest(requestId, "admin-1");
  assert.equal(created.status, "awaiting_source");
  assert.equal(calls, 1);
});

test("ingestion lookup by request validates id and preserves revision", async () => {
  let calls = 0;
  const service = new IngestionService(repository({
    findByRequestId: async parsed => {
      calls++;
      assert.equal(parsed, requestId);
      return record({ revision: 5 });
    },
  }));
  await assert.rejects(() => service.findByRequestId("bad"));
  assert.equal(calls, 0);
  assert.equal((await service.findByRequestId(requestId))?.revision, 5);
});

test("ingestion service allows legal transition and propagates actor", async () => {
  let received: unknown[] = [];
  const service = new IngestionService(repository({
    findById: async () => record({ status: "ready_to_generate", revision: 3 }),
    transition: async (...args) => {
      received = args;
      return { ...record(), status: "generating", updatedBy: "admin-1" };
    },
  }));

  const result = await service.transition(id, 3, "generating", "admin-1");
  assert.equal(result.status, "generating");
  assert.deepEqual(received, [id, 3, "ready_to_generate", "generating", "admin-1"]);
});

test("ingestion service rejects invalid transitions before persistence", async () => {
  let writes = 0;
  const service = new IngestionService(repository({
    findById: async () => record({ status: "awaiting_source", revision: 0 }),
    transition: async () => { writes++; return null; },
  }));

  await assert.rejects(() => service.transition(id, 0, "approved"), InvalidIngestionTransitionError);
  assert.equal(writes, 0);
});

test("ingestion service distinguishes missing, stale revision and atomic transition conflicts", async () => {
  const missing = new IngestionService(repository({ findById: async () => null }));
  await assert.rejects(() => missing.getById(id), NotFoundError);
  await assert.rejects(() => missing.transition(id, 0, "ready_to_generate"), NotFoundError);

  const stale = new IngestionService(repository({
    findById: async () => record({ revision: 2 }),
  }));
  await assert.rejects(() => stale.transition(id, 1, "ready_to_generate"), IngestionConflictError);

  let reads = 0;
  const atomicMiss = new IngestionService(repository({
    findById: async () => {
      reads++;
      return record({ revision: reads === 1 ? 0 : 1 });
    },
    transition: async () => null,
  }));
  await assert.rejects(() => atomicMiss.transition(id, 0, "ready_to_generate"), IngestionConflictError);
});
