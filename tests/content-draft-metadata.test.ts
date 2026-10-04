import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDraftMetadataCompleteness,
  type ContentDraftRecord,
} from "@/modules/content-drafts";
import { IngestionMetadataService } from "@/modules/ingestions/application/ingestion-metadata.service";
import { IngestionMetadataStateError } from "@/modules/ingestions/application/ingestion-metadata.error";

const ingestionId = "507f1f77bcf86cd799439011";
const draftId = "507f191e810c19729de860ea";

function draft(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
  return {
    id: draftId,
    ingestionId,
    identity: { songName: "Song" },
    source: { burmeseLyrics: "စာသား" },
    generated: {
      romanized: "Sa thar.",
      meaning: "Lyrics.",
      about: "About.",
      whenToListen: "When.",
    },
    metadata: {},
    artists: [{ kind: "unresolved", name: "Artist" }],
    revision: 4,
    ...overrides,
  };
}

test("factual metadata completeness requires genre only", () => {
  assert.deepEqual(evaluateDraftMetadataCompleteness({}), {
    complete: false,
    missing: ["genre"],
  });
  assert.deepEqual(evaluateDraftMetadataCompleteness({
    genre: "Pop",
  }), {
    complete: true,
    missing: [],
  });
});

test("metadata service saves factual fields without changing ingestion status", async () => {
  let currentDraft = draft({
    metadata: {
      youtubeLinks: ["https://youtube.com/old"],
      requestedBy: "Requester",
    },
  });
  let patchSeen: any;

  const service = new IngestionMetadataService(
    {
      getById: async () => ({
        id: ingestionId,
        songRequestId: "507f191e810c19729de860eb",
        status: "needs_admin_input",
        revision: 8,
      }),
    } as any,
    {
      getById: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any, updatedBy?: string) => {
        patchSeen = patch;
        const nextMetadata = { ...currentDraft.metadata };
        for (const [key, value] of Object.entries(patch.metadata ?? {})) {
          if (value === null) delete (nextMetadata as any)[key];
          else (nextMetadata as any)[key] = value;
        }
        currentDraft = draft({
          metadata: nextMetadata,
          revision: currentDraft.revision + 1,
          updatedBy,
        });
        return currentDraft;
      },
    } as any,
  );

  const result = await service.save(ingestionId, {
    draftId,
    draftRevision: 4,
    genre: "Pop",
    albumName: "Album",
    spotifyTrackId: null,
    spotifyLink: "https://open.spotify.com/track/abc",
    appleMusicLink: null,
    youtubeLinks: null,
    imageLink: null,
  }, "admin-1");

  assert.deepEqual(patchSeen, {
    metadata: {
      genre: "Pop",
      albumName: "Album",
      spotifyTrackId: null,
      spotifyLink: "https://open.spotify.com/track/abc",
      appleMusicLink: null,
      youtubeLinks: null,
      imageLink: null,
    },
  });
  assert.equal(result.draft.metadata.genre, "Pop");
  assert.equal(result.draft.metadata.requestedBy, "Requester");
  assert.equal(result.draft.metadata.youtubeLinks, undefined);
  assert.equal(result.completeness.complete, true);
});

test("metadata service allows final-review edits and rejects pre-generation states", async () => {
  const service = new IngestionMetadataService(
    {
      getById: async () => ({
        id: ingestionId,
        songRequestId: "507f191e810c19729de860eb",
        status: "awaiting_source",
        revision: 8,
      }),
    } as any,
    {} as any,
  );

  await assert.rejects(
    () => service.save(ingestionId, {
      draftId,
      draftRevision: 4,
      genre: "Pop",
      albumName: null,
      spotifyTrackId: null,
      spotifyLink: null,
      appleMusicLink: null,
      youtubeLinks: null,
      imageLink: null,
    }),
    IngestionMetadataStateError,
  );

  const reviewService = new IngestionMetadataService(
    {
      getById: async () => ({
        id: ingestionId,
        songRequestId: "507f191e810c19729de860eb",
        status: "ready_for_review",
        revision: 8,
      }),
    } as any,
    {
      getById: async () => draft({ metadata: { genre: "Pop" } }),
      update: async () => draft({ metadata: { genre: "Rock" }, revision: 5 }),
    } as any,
  );

  const reviewResult = await reviewService.save(ingestionId, {
    draftId,
    draftRevision: 4,
    genre: "Rock",
    albumName: null,
    spotifyTrackId: null,
    spotifyLink: null,
    appleMusicLink: null,
    youtubeLinks: null,
    imageLink: null,
  });
  assert.equal(reviewResult.ingestion.status, "ready_for_review");
});

test("metadata service rejects a draft belonging to another ingestion", async () => {
  const service = new IngestionMetadataService(
    {
      getById: async () => ({
        id: ingestionId,
        songRequestId: "507f191e810c19729de860eb",
        status: "needs_admin_input",
        revision: 8,
      }),
    } as any,
    {
      getById: async () => draft({ ingestionId: "507f1f77bcf86cd799439099" }),
    } as any,
  );

  await assert.rejects(
    () => service.save(ingestionId, {
      draftId,
      draftRevision: 4,
      genre: "Pop",
      albumName: null,
      spotifyTrackId: null,
      spotifyLink: null,
      appleMusicLink: null,
      youtubeLinks: null,
      imageLink: null,
    }),
    IngestionMetadataStateError,
  );
});
