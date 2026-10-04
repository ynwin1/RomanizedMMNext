import test from "node:test";
import assert from "node:assert/strict";
import { createIngestionActionHandler } from "@/app/admin/ingestions/ingestion-action-handler";
import {
  ContentGenerationProviderError,
  GeneratedContentQualityError,
} from "@/modules/content-generation";

const requestId = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";

function handler(overrides: Partial<Parameters<typeof createIngestionActionHandler>[0]> = {}) {
  return createIngestionActionHandler({
    authorize: async () => ({ userId: "admin-1" }),
    workflow: {
      startAcceptedRequest: async () => ({ ingestion: { id: ingestionId } as any, draft: {} as any }),
      saveAndConfirmSource: async () => ({ ingestion: { id: ingestionId } as any, draft: {} as any }),
    },
    generateAiContent: async () => ({}),
    saveMetadata: async () => ({}),
    started: id => { throw new Error("started:" + id); },
    sourceSaved: id => { throw new Error("source:" + id); },
    aiGenerated: id => { throw new Error("generated:" + id); },
    metadataSaved: id => { throw new Error("metadata:" + id); },
    logFailure: () => {},
    ...overrides,
  });
}

test("ingestion admin actions authorize before workflow writes or AI generation", async () => {
  let calls = 0;
  const denied = new Error("auth redirect");
  const actions = handler({
    authorize: async () => { throw denied; },
    generateAiContent: async () => { calls++; },
  });

  await assert.rejects(() => actions.start(requestId, {}, new FormData()), error => error === denied);
  const form = new FormData(); form.set("burmeseLyrics", "မြန်မာစာ");
  await assert.rejects(() => actions.saveSource(ingestionId, 0, 0, {}, form), error => error === denied);
  await assert.rejects(() => actions.generateAiContent(ingestionId, {}, new FormData()), error => error === denied);
  assert.equal(calls, 0);
});

test("source action validates lyrics before calling workflow", async () => {
  let calls = 0;
  const actions = handler({
    workflow: {
      startAcceptedRequest: async () => { throw new Error("unused"); },
      saveAndConfirmSource: async () => { calls++; throw new Error("unexpected"); },
    },
  });
  const form = new FormData(); form.set("burmeseLyrics", "   ");
  const result = await actions.saveSource(ingestionId, 0, 0, {}, form);
  assert.match(result.message ?? "", /valid Burmese source/);
  assert.equal(calls, 0);
});

test("start, source, and full AI generation redirect only after successful workflow", async () => {
  const calls: string[] = [];
  const actions = handler({
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
    generateAiContent: async (_id, actor) => {
      assert.equal(actor, "admin-1"); calls.push("generate");
    },
    started: id => { calls.push("started:" + id); throw new Error("start redirect"); },
    sourceSaved: id => { calls.push("saved:" + id); throw new Error("source redirect"); },
    aiGenerated: id => { calls.push("generated:" + id); throw new Error("generation redirect"); },
  });

  await assert.rejects(() => actions.start(requestId, {}, new FormData()), /start redirect/);
  const form = new FormData(); form.set("burmeseLyrics", "မြန်မာစာ");
  await assert.rejects(() => actions.saveSource(ingestionId, 2, 3, {}, form), /source redirect/);
  await assert.rejects(() => actions.generateAiContent(ingestionId, {}, new FormData()), /generation redirect/);
  assert.deepEqual(calls, [
    "start", "started:" + ingestionId,
    "source", "saved:" + ingestionId,
    "generate", "generated:" + ingestionId,
  ]);
});

test("provider and quality failures are logged and returned as retryable generation failures", async () => {
  let logged: unknown;
  const providerFailure = handler({
    generateAiContent: async () => {
      throw new ContentGenerationProviderError("secret provider detail", true, "http_429");
    },
    logFailure: error => { logged = error; },
  });

  const providerResult = await providerFailure.generateAiContent(ingestionId, {}, new FormData());
  assert.equal(
    providerResult.message,
    "AI generation failed quality or provider checks. You can retry this generation.",
  );
  assert.ok(logged instanceof ContentGenerationProviderError);

  const qualityFailure = handler({
    generateAiContent: async () => {
      throw new GeneratedContentQualityError([{
        code: "meaning_sentence_not_capitalized",
        field: "meaning",
        lineIndex: 0,
        message: "Each detected sentence must begin with a capital letter.",
      }]);
    },
    logFailure: error => { logged = error; },
  });

  const qualityResult = await qualityFailure.generateAiContent(ingestionId, {}, new FormData());
  assert.equal(
    qualityResult.message,
    "AI generation failed quality or provider checks. You can retry this generation.",
  );
  assert.ok(logged instanceof GeneratedContentQualityError);
});
