import test from "node:test";
import assert from "node:assert/strict";
import { SongRequestService } from "@/modules/requests/application/song-request.service";
import type { ISongRequestRepository } from "@/modules/requests/application/song-request.repository";
import { SongRequestConflictError } from "@/modules/requests/application/song-request-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { createRequestActionHandler } from "@/app/admin/requests/request-action-handler";

const id = "507f1f77bcf86cd799439011";
const entity = { id, songName: "Song", artist: "Artist", status: "pending" as const };

function repository(overrides: Partial<ISongRequestRepository> = {}): ISongRequestRepository {
  return {
    create: async input => ({ id, ...input, status: "pending" }),
    listQueue: async () => [],
    listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0,
    findAdminDetail: async () => ({ ...entity, revision: 0 }),
    updateStatus: async (_id, _revision, status) => ({ ...entity, status }),
    findById: async () => entity,
    ...overrides,
  };
}

test("request status update validates id, revision and lifecycle status before persistence", async () => {
  let calls = 0;
  let actor: string | undefined;
  const service = new SongRequestService(repository({ updateStatus: async (_id, _revision, _status, updatedBy) => {
    calls++; actor = updatedBy; return entity;
  } }));
  await assert.rejects(() => service.updateStatus("bad", 0, "reviewing"));
  await assert.rejects(() => service.updateStatus(id, -1, "reviewing"));
  await assert.rejects(() => service.updateStatus(id, 0, "added"));
  assert.equal(calls, 0);
  assert.equal((await service.updateStatus(id, 0, "accepted", "admin-1")).status, "pending");
  assert.equal(calls, 1);
  assert.equal(actor, "admin-1");
});

test("request status update distinguishes missing request from stale revision", async () => {
  const stale = new SongRequestService(repository({ updateStatus: async () => null }));
  await assert.rejects(() => stale.updateStatus(id, 0, "reviewing"), SongRequestConflictError);
  const missing = new SongRequestService(repository({ updateStatus: async () => null, findById: async () => null }));
  await assert.rejects(() => missing.updateStatus(id, 0, "reviewing"), NotFoundError);
});

test("request detail validates id and returns not found", async () => {
  let calls = 0;
  const service = new SongRequestService(repository({ findAdminDetail: async () => { calls++; return null; } }));
  await assert.rejects(() => service.getAdminDetail("bad"));
  assert.equal(calls, 0);
  await assert.rejects(() => service.getAdminDetail(id), NotFoundError);
});

test("request action authorizes before write and handles status errors", async () => {
  let writes = 0;
  const denied = new Error("auth redirect");
  const handler = createRequestActionHandler({
    authorize: async () => { throw denied; },
    requests: { updateStatus: async () => { writes++; return entity; } },
    saved: () => { throw new Error("unexpected redirect"); },
    logFailure: () => {},
  });
  const form = new FormData(); form.set("status", "reviewing");
  await assert.rejects(() => handler.update(id, 0, {}, form), error => error === denied);
  assert.equal(writes, 0);

  const validating = createRequestActionHandler({
    authorize: async () => ({ userId: "admin-1" }),
    requests: new SongRequestService(repository()),
    saved: () => { throw new Error("unexpected redirect"); },
    logFailure: () => {},
  });
  form.set("status", "added");
  assert.equal((await validating.update(id, 0, {}, form)).message, "Choose a valid request status.");
});

test("request action redirects only after successful persistence and hides internal errors", async () => {
  const calls: string[] = [];
  const form = new FormData(); form.set("status", "completed");
  const handler = createRequestActionHandler({
    authorize: async () => { calls.push("auth"); return { userId: "admin-1" }; },
    requests: { updateStatus: async (_id, _revision, _status, updatedBy) => { assert.equal(updatedBy, "admin-1"); calls.push("write"); return entity; } },
    saved: savedId => { calls.push("saved:" + savedId); throw new Error("success redirect"); },
    logFailure: () => {},
  });
  await assert.rejects(() => handler.update(id, 3, {}, form), /success redirect/);
  assert.deepEqual(calls, ["auth", "write", "saved:" + id]);

  for (const error of [new SongRequestConflictError(), new NotFoundError("missing"), new Error("mongodb://secret")]) {
    const failing = createRequestActionHandler({
      authorize: async () => ({ userId: "admin-1" }),
      requests: { updateStatus: async () => { throw error; } },
      saved: () => { throw new Error("unexpected"); },
      logFailure: () => {},
    });
    const result = await failing.update(id, 0, {}, form);
    assert.doesNotMatch(result.message ?? "", /secret/);
  }
});
