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
    resolveArtist: async () => ({}),
    addArtist: async () => ({}),
    removeArtist: async () => ({}),
    confirmArtists: async () => ({}),
    reopenAdminInput: async () => ({}),
    started: id => { throw new Error("started:" + id); },
    sourceSaved: id => { throw new Error("source:" + id); },
    aiGenerated: id => { throw new Error("generated:" + id); },
    metadataSaved: id => { throw new Error("metadata:" + id); },
    artistChanged: id => { throw new Error("artist:" + id); },
    artistsConfirmed: id => { throw new Error("artists-confirmed:" + id); },
    adminInputReopened: id => { throw new Error("admin-input-reopened:" + id); },
    logFailure: () => {},
    ...overrides,
  });
}

test("artist resolution action validates and passes canonical selection with actor", async () => {
  let inputSeen: any;
  let actorSeen: string | undefined;
  const actions = handler({
    resolveArtist: async (_ingestionId, input, actor) => {
      inputSeen = input;
      actorSeen = actor;
    },
    artistChanged: id => { throw new Error("resolved:" + id); },
  });

  const form = new FormData();
  form.set("artistSlug", "canonical-artist");

  await assert.rejects(
    () => actions.resolveArtist(ingestionId, draftId, 7, 0, {}, form),
    /resolved:/,
  );

  assert.equal(actorSeen, "admin-1");
  assert.deepEqual(inputSeen, {
    draftId,
    draftRevision: 7,
    artistIndex: 0,
    artistSlug: "canonical-artist",
  });
});

test("artist add action supports name-only entries", async () => {
  let inputSeen: any;
  const actions = handler({
    addArtist: async (_ingestionId, input) => { inputSeen = input; },
    artistChanged: id => { throw new Error("added:" + id); },
  });

  const form = new FormData();
  form.set("artistName", " New Featured Singer ");

  await assert.rejects(
    () => actions.addArtist(ingestionId, draftId, 7, {}, form),
    /added:/,
  );

  assert.deepEqual(inputSeen, {
    draftId,
    draftRevision: 7,
    artistName: "New Featured Singer",
  });
});

test("artist remove action passes selected index and revision", async () => {
  let inputSeen: any;
  const actions = handler({
    removeArtist: async (_ingestionId, input) => { inputSeen = input; },
    artistChanged: id => { throw new Error("removed:" + id); },
  });

  await assert.rejects(
    () => actions.removeArtist(ingestionId, draftId, 9, 2, {}, new FormData()),
    /removed:/,
  );

  assert.deepEqual(inputSeen, {
    draftId,
    draftRevision: 9,
    artistIndex: 2,
  });
});

test("confirm artist list action advances through service and redirect", async () => {
  let inputSeen: any;
  const actions = handler({
    confirmArtists: async (_ingestionId, input) => { inputSeen = input; },
    artistsConfirmed: id => { throw new Error("confirmed:" + id); },
  });

  await assert.rejects(
    () => actions.confirmArtists(ingestionId, draftId, {}, new FormData()),
    /confirmed:/,
  );

  assert.deepEqual(inputSeen, { draftId });
});

test("artist actions reject malformed input before service call", async () => {
  let calls = 0;
  const actions = handler({
    resolveArtist: async () => { calls++; },
    addArtist: async () => { calls++; },
  });

  const badSlug = new FormData();
  badSlug.set("artistSlug", "Bad Slug");
  const resolution = await actions.resolveArtist(ingestionId, draftId, 7, 0, {}, badSlug);
  assert.equal(resolution.message, "Select a valid existing artist.");

  const blankName = new FormData();
  blankName.set("artistName", " ");
  const addition = await actions.addArtist(ingestionId, draftId, 7, {}, blankName);
  assert.equal(addition.message, "Enter a valid artist name.");
  assert.equal(calls, 0);
});

test("artist actions authorize before writes", async () => {
  let calls = 0;
  const denied = new Error("auth redirect");
  const actions = handler({
    authorize: async () => { throw denied; },
    addArtist: async () => { calls++; },
  });

  const form = new FormData();
  form.set("artistName", "Singer");

  await assert.rejects(
    () => actions.addArtist(ingestionId, draftId, 7, {}, form),
    error => error === denied,
  );
  assert.equal(calls, 0);
});


test("reopen admin input action passes the draft and actor", async () => {
  let inputSeen: any;
  let actorSeen: string | undefined;
  const actions = handler({
    reopenAdminInput: async (_ingestionId, input, actor) => {
      inputSeen = input;
      actorSeen = actor;
    },
    adminInputReopened: id => { throw new Error("reopened:" + id); },
  });

  await assert.rejects(
    () => actions.reopenAdminInput(ingestionId, draftId, {}, new FormData()),
    /reopened:/,
  );

  assert.deepEqual(inputSeen, { draftId });
  assert.equal(actorSeen, "admin-1");
});
