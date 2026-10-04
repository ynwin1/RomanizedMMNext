import test from "node:test";
import assert from "node:assert/strict";
import { createIngestionActionHandler } from "@/app/admin/ingestions/ingestion-action-handler";

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
    started: id => { throw new Error("started:" + id); },
    sourceSaved: id => { throw new Error("source:" + id); },
    aiGenerated: id => { throw new Error("generated:" + id); },
    metadataSaved: id => { throw new Error("metadata:" + id); },
    logFailure: () => {},
    ...overrides,
  });
}

test("metadata action normalizes optional blanks and YouTube links before saving", async () => {
  let inputSeen: any;
  let actorSeen: string | undefined;
  const actions = handler({
    saveMetadata: async (_ingestionId, input, actor) => {
      inputSeen = input;
      actorSeen = actor;
    },
    metadataSaved: id => { throw new Error("saved:" + id); },
  });

  const form = new FormData();
  form.set("genre", " Pop ");
  form.set("albumName", " ");
  form.set("spotifyTrackId", " track-1 ");
  form.set("spotifyLink", "https://open.spotify.com/track/track-1");
  form.set("appleMusicLink", "");
  form.set("youtubeLinks", "https://youtube.com/watch?v=1\n\n https://youtu.be/2 ");
  form.set("imageLink", "");

  await assert.rejects(
    () => actions.saveMetadata(ingestionId, draftId, 7, {}, form),
    /saved:/,
  );

  assert.equal(actorSeen, "admin-1");
  assert.deepEqual(inputSeen, {
    draftId,
    draftRevision: 7,
    genre: "Pop",
    albumName: null,
    spotifyTrackId: "track-1",
    spotifyLink: "https://open.spotify.com/track/track-1",
    appleMusicLink: null,
    youtubeLinks: [
      "https://youtube.com/watch?v=1",
      "https://youtu.be/2",
    ],
    imageLink: null,
  });
});

test("metadata action rejects blank genre and invalid URLs before service call", async () => {
  let calls = 0;
  const actions = handler({
    saveMetadata: async () => { calls++; },
  });

  const blankGenre = new FormData();
  blankGenre.set("genre", " ");
  const blankResult = await actions.saveMetadata(ingestionId, draftId, 7, {}, blankGenre);
  assert.equal(blankResult.message, "Enter valid factual metadata.");
  assert.equal(calls, 0);

  const badUrl = new FormData();
  badUrl.set("genre", "Pop");
  badUrl.set("spotifyLink", "not-a-url");
  const urlResult = await actions.saveMetadata(ingestionId, draftId, 7, {}, badUrl);
  assert.equal(urlResult.message, "Enter valid factual metadata.");
  assert.equal(calls, 0);
});

test("metadata action authorizes before service write", async () => {
  let calls = 0;
  const denied = new Error("auth redirect");
  const actions = handler({
    authorize: async () => { throw denied; },
    saveMetadata: async () => { calls++; },
  });

  const form = new FormData();
  form.set("genre", "Pop");

  await assert.rejects(
    () => actions.saveMetadata(ingestionId, draftId, 7, {}, form),
    error => error === denied,
  );
  assert.equal(calls, 0);
});
