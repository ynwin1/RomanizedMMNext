import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDraftAdminInputCompleteness,
  type ContentDraftRecord,
} from "@/modules/content-drafts";
import { IngestionMetadataService } from "@/modules/ingestions/application/ingestion-metadata.service";

const ingestionId = "507f1f77bcf86cd799439011";
const draftId = "507f191e810c19729de860ea";

function baseDraft(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
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
    metadata: { genre: "Pop" },
    artists: [{ kind: "unresolved", name: "Name-only Artist" }],
    revision: 4,
    ...overrides,
  };
}

test("admin-input completeness accepts unresolved name-only artists", () => {
  assert.deepEqual(evaluateDraftAdminInputCompleteness(baseDraft()), {
    complete: true,
    metadataComplete: true,
    artistsComplete: true,
  });

  assert.deepEqual(evaluateDraftAdminInputCompleteness(baseDraft({ metadata: {} })), {
    complete: false,
    metadataComplete: false,
    artistsComplete: true,
  });

  assert.deepEqual(evaluateDraftAdminInputCompleteness(baseDraft({ artists: [] })), {
    complete: false,
    metadataComplete: true,
    artistsComplete: false,
  });
});

test("saving metadata does not auto-advance before explicit artist-list confirmation", async () => {
  let currentDraft = baseDraft({ metadata: {}, revision: 4 });
  let transitions = 0;

  const service = new IngestionMetadataService(
    {
      getById: async () => ({
        id: ingestionId,
        songRequestId: "507f191e810c19729de860ec",
        status: "needs_admin_input",
        revision: 8,
      }),
      transition: async () => { transitions++; throw new Error("should not transition"); },
    } as any,
    {
      getById: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = baseDraft({
          metadata: { ...currentDraft.metadata, ...patch.metadata, genre: "Pop" },
          revision: 5,
        });
        return currentDraft;
      },
    } as any,
  );

  const result = await service.save(ingestionId, {
    draftId,
    draftRevision: 4,
    genre: "Pop",
    albumName: null,
    spotifyTrackId: null,
    spotifyLink: null,
    appleMusicLink: null,
    youtubeLinks: null,
    imageLink: null,
  }, "admin-1");

  assert.equal(transitions, 0);
  assert.equal(result.adminInputCompleteness.complete, true);
  assert.equal(result.ingestion.status, "needs_admin_input");
});
