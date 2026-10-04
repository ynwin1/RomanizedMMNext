import test from "node:test";
import assert from "node:assert/strict";
import { createIngestionActionHandler } from "@/app/admin/ingestions/ingestion-action-handler";
import {
  ContentGenerationProviderError,
  GeneratedContentQualityError,
} from "@/modules/content-generation";

const requestId = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";
const draftId = "507f191e810c19729de860eb";

function handler(overrides: Partial<Parameters<typeof createIngestionActionHandler>[0]> = {}) {
  return createIngestionActionHandler({
    authorize: async () => ({ userId: "admin-1" }),
    workflow: {
      startAcceptedRequest: async () => ({ ingestion: { id: ingestionId } as any, draft: {} as any }),
      saveAndConfirmSource: async () => ({ ingestion: { id: ingestionId } as any, draft: {} as any }),
    },
    generateAiContent: async () => ({}),
    saveMetadata: async () => ({}),
    saveReview: async () => ({}),
    publishSong: async () => ({ mmid: 200, songName: "Published Song" }),
    resolveArtist: async () => ({}),
    addArtist: async () => ({}),
    removeArtist: async () => ({}),
    confirmArtists: async () => ({}),
    started: id => { throw new Error("started:" + id); },
    aiGenerated: id => { throw new Error("generated:" + id); },
    generationFailed: id => { throw new Error("generation-failed:" + id); },
    metadataSaved: id => { throw new Error("metadata:" + id); },
    reviewSaved: id => { throw new Error("review:" + id); },
    published: song => { throw new Error("published:" + song.mmid); },
    artistChanged: id => { throw new Error("artist:" + id); },
    artistsConfirmed: id => { throw new Error("artists-confirmed:" + id); },
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

test("source action validates lyrics before writes", async () => {
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

test("saving source automatically runs AI and redirects to final review", async () => {
  const calls: string[] = [];
  const actions = handler({
    workflow: {
      startAcceptedRequest: async () => { throw new Error("unused"); },
      saveAndConfirmSource: async (_input, actor) => {
        assert.equal(actor, "admin-1");
        calls.push("source");
        return { ingestion: { id: ingestionId } as any, draft: {} as any };
      },
    },
    generateAiContent: async (_id, actor) => {
      assert.equal(actor, "admin-1");
      calls.push("generate");
    },
    aiGenerated: id => {
      calls.push("review:" + id);
      throw new Error("review redirect");
    },
  });

  const form = new FormData(); form.set("burmeseLyrics", "မြန်မာစာ");
  await assert.rejects(
    () => actions.saveSource(ingestionId, 2, 3, {}, form),
    /review redirect/,
  );
  assert.deepEqual(calls, ["source", "generate", "review:" + ingestionId]);
});

test("source-triggered AI failure redirects to retry state instead of asking for another transition", async () => {
  const actions = handler({
    generateAiContent: async () => {
      throw new ContentGenerationProviderError("provider down", true, "http_500");
    },
    generationFailed: id => { throw new Error("failed:" + id); },
  });

  const form = new FormData(); form.set("burmeseLyrics", "မြန်မာစာ");
  await assert.rejects(
    () => actions.saveSource(ingestionId, 2, 3, {}, form),
    /failed:/,
  );
});

test("explicit retry still returns safe provider/quality failures", async () => {
  let logged: unknown;
  const providerFailure = handler({
    generateAiContent: async () => {
      throw new ContentGenerationProviderError("secret provider detail", true, "http_429");
    },
    logFailure: error => { logged = error; },
  });

  const providerResult = await providerFailure.generateAiContent(ingestionId, {}, new FormData());
  assert.equal(providerResult.message, "AI generation failed quality or provider checks. You can retry.");
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
  assert.equal(qualityResult.message, "AI generation failed quality or provider checks. You can retry.");
  assert.ok(logged instanceof GeneratedContentQualityError);
});

test("review action passes editable generated and factual fields", async () => {
  let inputSeen: any;
  const actions = handler({
    saveReview: async (_id, input) => { inputSeen = input; },
    reviewSaved: id => { throw new Error("saved:" + id); },
  });

  const form = new FormData();
  form.set("songName", "Corrected");
  form.set("burmeseLyrics", "စာသား");
  form.set("romanized", "Romanized.");
  form.set("meaning", "Meaning.");
  form.set("about", "About.");
  form.set("whenToListen", "When.");
  form.set("genre", "Pop");

  await assert.rejects(
    () => actions.saveReview(ingestionId, draftId, 4, {}, form),
    /saved:/,
  );
  assert.equal(inputSeen.songName, "Corrected");
  assert.equal(inputSeen.romanized, "Romanized.");
  assert.equal(inputSeen.genre, "Pop");
});


test("publish intent saves the current review before publishing and redirects to the live song", async () => {
  const calls: string[] = [];
  const actions = handler({
    saveReview: async (_id, input) => {
      assert.equal(input.songName, "Final Song");
      assert.equal(input.meaning, "Final meaning.");
      calls.push("save");
    },
    publishSong: async (_id, actor) => {
      assert.equal(actor, "admin-1");
      calls.push("publish");
      return { mmid: 200, songName: "Final Song" };
    },
    published: song => {
      calls.push("redirect:" + song.mmid);
      throw new Error("published redirect");
    },
  });

  const form = new FormData();
  form.set("intent", "publish");
  form.set("songName", "Final Song");
  form.set("burmeseLyrics", "စာသား");
  form.set("romanized", "Romanized.");
  form.set("meaning", "Final meaning.");
  form.set("about", "About.");
  form.set("whenToListen", "When.");
  form.set("genre", "Pop");

  await assert.rejects(
    () => actions.saveReview(ingestionId, draftId, 4, {}, form),
    /published redirect/,
  );
  assert.deepEqual(calls, ["save", "publish", "redirect:200"]);
});
