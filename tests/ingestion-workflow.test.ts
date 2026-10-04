import test from "node:test";
import assert from "node:assert/strict";
import { IngestionWorkflowService } from "@/modules/ingestions/application/ingestion-workflow.service";
import { RequestNotAcceptedForIngestionError, IngestionSourceStateError } from "@/modules/ingestions/application/ingestion-workflow.error";
import type { IngestionRecord } from "@/modules/ingestions/domain/ingestion.types";
import type { ContentDraftRecord } from "@/modules/content-drafts/domain/content-draft.types";
import { NotFoundError } from "@/shared/errors/not-found.error";

const requestId = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";
const draftId = "507f191e810c19729de860eb";

function ingestion(overrides: Partial<IngestionRecord> = {}): IngestionRecord {
  return { id: ingestionId, songRequestId: requestId, status: "awaiting_source", revision: 0, ...overrides };
}
function draft(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
  return { id: draftId, ingestionId, identity: {}, source: {}, generated: {}, metadata: {}, artists: [], revision: 0, ...overrides };
}

test("workflow starts only accepted requests and seeds request-owned draft fields", async () => {
  const updates: unknown[] = [];
  let createdIngestion = false;
  let createdDraft = false;
  let currentDraft = draft();

  const service = new IngestionWorkflowService(
    {
      createForRequest: async () => { createdIngestion = true; return ingestion(); },
      getById: async () => ingestion(),
      findByRequestId: async () => null,
      transition: async () => ingestion(),
    } as any,
    { getAdminDetail: async () => ({
      id: requestId,
      songName: "Requested Song",
      artist: "Requested Artist",
      youtubeLink: "https://youtube.com/watch?v=1",
      requestedBy: "Listener",
      status: "accepted" as const,
      revision: 1,
    }) },
    {
      getByIngestionId: async () => {
        if (!createdDraft) throw new NotFoundError("Content draft not found");
        return currentDraft;
      },
      createForIngestion: async () => {
        createdDraft = true;
        currentDraft = draft();
        return currentDraft;
      },
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        updates.push(patch);
        currentDraft = draft({
          identity: { ...currentDraft.identity, ...patch.identity },
          metadata: { ...currentDraft.metadata, ...patch.metadata },
          artists: patch.artists ?? currentDraft.artists,
          revision: currentDraft.revision + 1,
        });
        return currentDraft;
      },
    } as any,
  );

  const result = await service.startAcceptedRequest(requestId, "admin-1");
  assert.equal(createdIngestion, true);
  assert.equal(result.ingestion.id, ingestionId);
  assert.deepEqual(updates, [{
    identity: { songName: "Requested Song" },
    metadata: { requestedBy: "Listener" },
    artists: [{ kind: "unresolved", name: "Requested Artist" }],
  }]);
  assert.equal(result.draft.identity.songName, "Requested Song");
  assert.equal(result.draft.artists[0]?.name, "Requested Artist");
});

test("workflow refuses non-accepted request before creating work", async () => {
  let creates = 0;
  const service = new IngestionWorkflowService(
    {
      createForRequest: async () => { creates++; return ingestion(); },
      getById: async () => ingestion(),
      findByRequestId: async () => null,
      transition: async () => ingestion(),
    } as any,
    { getAdminDetail: async () => ({ id: requestId, songName: "Song", artist: "Artist", status: "reviewing" as const, revision: 0 }) },
    {} as any,
  );
  await assert.rejects(() => service.startAcceptedRequest(requestId), RequestNotAcceptedForIngestionError);
  assert.equal(creates, 0);
});

test("workflow start is retry-safe when ingestion and fully seeded draft already exist", async () => {
  let creates = 0;
  const existingDraft = draft({
    identity: { songName: "Already seeded" },
    metadata: { requestedBy: "Listener" },
    artists: [{ kind: "unresolved", name: "Artist" }],
    revision: 3,
  });

  const service = new IngestionWorkflowService(
    {
      createForRequest: async () => { creates++; return ingestion(); },
      getById: async () => ingestion(),
      findByRequestId: async () => ingestion(),
      transition: async () => ingestion(),
    } as any,
    { getAdminDetail: async () => ({
      id: requestId,
      songName: "Song",
      artist: "Artist",
      youtubeLink: "https://youtube.com/watch?v=1",
      requestedBy: "Listener",
      status: "accepted" as const,
      revision: 0,
    }) },
    {
      getByIngestionId: async () => existingDraft,
      createForIngestion: async () => { throw new Error("should not create"); },
      update: async () => { throw new Error("should not reseed"); },
    } as any,
  );

  const result = await service.startAcceptedRequest(requestId);
  assert.equal(creates, 0);
  assert.equal(result.draft.revision, 3);
});

test("workflow repairs a partially-created draft without promoting request YouTube data into draft metadata", async () => {
  let currentDraft = draft({ revision: 0 });
  const updates: any[] = [];

  const service = new IngestionWorkflowService(
    {
      createForRequest: async () => { throw new Error("should not create ingestion"); },
      getById: async () => ingestion(),
      findByRequestId: async () => ingestion(),
      transition: async () => ingestion(),
    } as any,
    { getAdminDetail: async () => ({
      id: requestId,
      songName: "Recovered Song",
      artist: "Recovered Artist",
      youtubeLink: "https://youtube.com/watch?v=request-context-only",
      requestedBy: "Listener",
      status: "accepted" as const,
      revision: 2,
    }) },
    {
      getByIngestionId: async () => currentDraft,
      createForIngestion: async () => { throw new Error("should not create draft"); },
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        updates.push(patch);
        currentDraft = draft({
          identity: { ...currentDraft.identity, ...patch.identity },
          metadata: { ...currentDraft.metadata, ...patch.metadata },
          artists: patch.artists ?? currentDraft.artists,
          revision: currentDraft.revision + 1,
        });
        return currentDraft;
      },
    } as any,
  );

  const result = await service.startAcceptedRequest(requestId, "admin-1");

  assert.deepEqual(updates, [{
    identity: { songName: "Recovered Song" },
    metadata: { requestedBy: "Listener" },
    artists: [{ kind: "unresolved", name: "Recovered Artist" }],
  }]);
  assert.equal(result.draft.identity.songName, "Recovered Song");
  assert.equal(result.draft.artists[0]?.name, "Recovered Artist");
  assert.equal(result.draft.metadata.youtubeLinks, undefined);
});

test("workflow repairs only missing seed sections without overwriting admin-owned draft metadata", async () => {
  let currentDraft = draft({
    identity: { songName: "Existing Song" },
    metadata: { youtubeLinks: ["https://youtube.com/existing"] },
    artists: [],
    revision: 5,
  });
  let patchSeen: any;

  const service = new IngestionWorkflowService(
    {
      getById: async () => ingestion(),
      findByRequestId: async () => ingestion(),
    } as any,
    { getAdminDetail: async () => ({
      id: requestId,
      songName: "Request Song",
      artist: "Missing Artist",
      youtubeLink: "https://youtube.com/request",
      requestedBy: "Listener",
      status: "accepted" as const,
      revision: 2,
    }) },
    {
      getByIngestionId: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        patchSeen = patch;
        currentDraft = draft({
          identity: currentDraft.identity,
          metadata: { ...currentDraft.metadata, ...patch.metadata },
          artists: patch.artists ?? currentDraft.artists,
          revision: 6,
        });
        return currentDraft;
      },
    } as any,
  );

  const result = await service.startAcceptedRequest(requestId);
  assert.deepEqual(patchSeen, {
    metadata: { requestedBy: "Listener" },
    artists: [{ kind: "unresolved", name: "Missing Artist" }],
  });
  assert.equal(result.draft.identity.songName, "Existing Song");
  assert.deepEqual(result.draft.metadata.youtubeLinks, ["https://youtube.com/existing"]);
});

test("saving trusted source writes draft then advances ingestion to ready_to_generate", async () => {
  const calls: string[] = [];
  let current = ingestion({ revision: 2 });
  let currentDraft = draft({ revision: 4 });

  const service = new IngestionWorkflowService(
    {
      getById: async () => current,
      transition: async (_id: unknown, revision: number, status: string, actor?: string) => {
        assert.equal(revision, 2);
        assert.equal(status, "ready_to_generate");
        assert.equal(actor, "admin-1");
        calls.push("transition");
        current = ingestion({ status: "ready_to_generate", revision: 3 });
        return current;
      },
    } as any,
    {} as any,
    {
      getByIngestionId: async () => currentDraft,
      update: async (_id: unknown, revision: number, patch: any, actor?: string) => {
        assert.equal(revision, 4);
        assert.deepEqual(patch, { source: { burmeseLyrics: "မြန်မာစာ" } });
        assert.equal(actor, "admin-1");
        calls.push("draft");
        currentDraft = draft({ source: { burmeseLyrics: "မြန်မာစာ" }, revision: 5 });
        return currentDraft;
      },
    } as any,
  );

  const result = await service.saveAndConfirmSource({
    ingestionId, ingestionRevision: 2, draftRevision: 4, burmeseLyrics: "မြန်မာစာ",
  }, "admin-1");
  assert.deepEqual(calls, ["draft", "transition"]);
  assert.equal(result.ingestion.status, "ready_to_generate");
  assert.equal(result.draft.source.burmeseLyrics, "မြန်မာစာ");
});

test("source confirmation only works from awaiting_source", async () => {
  const service = new IngestionWorkflowService(
    { getById: async () => ingestion({ status: "ready_to_generate" }) } as any,
    {} as any,
    {} as any,
  );
  await assert.rejects(() => service.saveAndConfirmSource({
    ingestionId, ingestionRevision: 0, draftRevision: 0, burmeseLyrics: "မြန်မာစာ",
  }), IngestionSourceStateError);
});
