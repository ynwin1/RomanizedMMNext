import test from "node:test";
import assert from "node:assert/strict";
import { createIngestionActionHandler } from "@/app/admin/ingestions/ingestion-action-handler";

const requestId = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";

test("ingestion admin actions authorize before workflow writes", async () => {
  let calls = 0;
  const denied = new Error("auth redirect");
  const handler = createIngestionActionHandler({
    authorize: async () => { throw denied; },
    workflow: {
      startAcceptedRequest: async () => { calls++; throw new Error("unexpected"); },
      saveAndConfirmSource: async () => { calls++; throw new Error("unexpected"); },
    },
    started: () => { throw new Error("unexpected"); },
    sourceSaved: () => { throw new Error("unexpected"); },
    logFailure: () => {},
  });

  await assert.rejects(() => handler.start(requestId, {}, new FormData()), error => error === denied);
  const form = new FormData(); form.set("burmeseLyrics", "မြန်မာစာ");
  await assert.rejects(() => handler.saveSource(ingestionId, 0, 0, {}, form), error => error === denied);
  assert.equal(calls, 0);
});

test("source action validates lyrics before calling workflow", async () => {
  let calls = 0;
  const handler = createIngestionActionHandler({
    authorize: async () => ({ userId: "admin-1" }),
    workflow: {
      startAcceptedRequest: async () => { throw new Error("unused"); },
      saveAndConfirmSource: async () => { calls++; throw new Error("unexpected"); },
    },
    started: () => { throw new Error("unused"); },
    sourceSaved: () => { throw new Error("unexpected"); },
    logFailure: () => {},
  });
  const form = new FormData(); form.set("burmeseLyrics", "   ");
  const result = await handler.saveSource(ingestionId, 0, 0, {}, form);
  assert.match(result.message ?? "", /valid Burmese source/);
  assert.equal(calls, 0);
});

test("start and source actions redirect only after successful workflow", async () => {
  const calls: string[] = [];
  const handler = createIngestionActionHandler({
    authorize: async () => ({ userId: "admin-1" }),
    workflow: {
      startAcceptedRequest: async (_requestId, actor) => {
        assert.equal(actor, "admin-1"); calls.push("start");
        return { ingestion: { id: ingestionId } as any, draft: {} as any };
      },
      saveAndConfirmSource: async (_input, actor) => {
        assert.equal(actor, "admin-1"); calls.push("source");
        return { ingestion: { id: ingestionId } as any, draft: {} as any };
      },
    },
    started: id => { calls.push("started:" + id); throw new Error("start redirect"); },
    sourceSaved: id => { calls.push("saved:" + id); throw new Error("source redirect"); },
    logFailure: () => {},
  });

  await assert.rejects(() => handler.start(requestId, {}, new FormData()), /start redirect/);
  const form = new FormData(); form.set("burmeseLyrics", "မြန်မာစာ");
  await assert.rejects(() => handler.saveSource(ingestionId, 2, 3, {}, form), /source redirect/);
  assert.deepEqual(calls, ["start", "started:" + ingestionId, "source", "saved:" + ingestionId]);
});
