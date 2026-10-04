import test from "node:test";
import assert from "node:assert/strict";
import { createRequestActionHandler } from "@/app/admin/requests/request-action-handler";

const requestId = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";

function handler(overrides: Partial<Parameters<typeof createRequestActionHandler>[0]> = {}) {
  return createRequestActionHandler({
    authorize: async () => ({ userId: "admin-1" }),
    requests: {
      updateStatus: async () => ({ id: requestId, songName: "Song", artist: "Artist" } as any),
    },
    acceptRequest: async () => ({ ingestion: { id: ingestionId } }),
    saved: id => { throw new Error("saved:" + id); },
    accepted: id => { throw new Error("accepted:" + id); },
    rejected: () => { throw new Error("rejected"); },
    logFailure: () => {},
    ...overrides,
  });
}

test("request accept is one action that starts ingestion and redirects to source workflow", async () => {
  const calls: string[] = [];
  const actions = handler({
    acceptRequest: async (id, revision, actor) => {
      assert.equal(id, requestId);
      assert.equal(revision, 3);
      assert.equal(actor, "admin-1");
      calls.push("accept");
      return { ingestion: { id: ingestionId } };
    },
    accepted: id => {
      calls.push("redirect:" + id);
      throw new Error("accepted redirect");
    },
  });

  const form = new FormData();
  form.set("decision", "accept");
  await assert.rejects(() => actions.decide(requestId, 3, {}, form), /accepted redirect/);
  assert.deepEqual(calls, ["accept", "redirect:" + ingestionId]);
});

test("request reject updates status directly and exits the queue", async () => {
  let statusSeen: string | undefined;
  const actions = handler({
    requests: {
      updateStatus: async (_id: unknown, _revision: unknown, status: any) => {
        statusSeen = status;
        return {} as any;
      },
    },
    rejected: () => { throw new Error("rejected redirect"); },
  });

  const form = new FormData();
  form.set("decision", "reject");
  await assert.rejects(() => actions.decide(requestId, 1, {}, form), /rejected redirect/);
  assert.equal(statusSeen, "rejected");
});

test("request decision authorizes before accept or reject work", async () => {
  let calls = 0;
  const denied = new Error("auth redirect");
  const actions = handler({
    authorize: async () => { throw denied; },
    acceptRequest: async () => { calls++; return { ingestion: { id: ingestionId } }; },
    requests: { updateStatus: async () => { calls++; return {} as any; } },
  });

  const form = new FormData();
  form.set("decision", "accept");
  await assert.rejects(() => actions.decide(requestId, 0, {}, form), error => error === denied);
  assert.equal(calls, 0);
});
