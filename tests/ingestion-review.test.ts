import test from "node:test";
import assert from "node:assert/strict";
import type { ContentDraftRecord } from "@/modules/content-drafts";
import { IngestionReviewService } from "@/modules/ingestions/application/ingestion-review.service";
import { IngestionReviewStateError } from "@/modules/ingestions/application/ingestion-review.error";

const ingestionId = "507f1f77bcf86cd799439011";
const draftId = "507f191e810c19729de860ea";

function draft(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
  return {
    id: draftId,
    ingestionId,
    identity: { songName: "Old Song" },
    source: { burmeseLyrics: "စာသား" },
    generated: {
      romanized: "Old romanization.",
      meaning: "Old meaning.",
      about: "Old about.",
      whenToListen: "Old context.",
    },
    metadata: { genre: "Pop" },
    artists: [{ kind: "unresolved", name: "Artist" }],
    revision: 4,
    ...overrides,
  };
}

test("final review edits identity, source, AI output, and metadata without state transition", async () => {
  let currentDraft = draft();
  let patchSeen: any;

  const service = new IngestionReviewService(
    {
      getById: async () => ({
        id: ingestionId,
        songRequestId: "507f191e810c19729de860eb",
        status: "ready_for_review",
        revision: 9,
      }),
    } as any,
    {
      getById: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        patchSeen = patch;
        currentDraft = draft({
          identity: patch.identity,
          source: patch.source,
          generated: patch.generated,
          metadata: { genre: patch.metadata.genre ?? undefined },
          revision: 5,
        });
        return currentDraft;
      },
    } as any,
  );

  const result = await service.save(ingestionId, {
    draftId,
    draftRevision: 4,
    songName: "Corrected Song",
    burmeseLyrics: "ပြင်ထားသောစာသား",
    romanized: "Corrected romanization.",
    meaning: "Corrected meaning.",
    about: "One-line about.",
    whenToListen: "One-line listening context.",
    genre: "Rock",
    albumName: null,
    spotifyTrackId: null,
    spotifyLink: null,
    appleMusicLink: null,
    youtubeLinks: null,
    imageLink: null,
  }, "admin-1");

  assert.equal(patchSeen.identity.songName, "Corrected Song");
  assert.equal(patchSeen.generated.romanized, "Corrected romanization.");
  assert.equal(patchSeen.generated.meaning, "Corrected meaning.");
  assert.equal(patchSeen.metadata.genre, "Rock");
  assert.equal(result.ingestion.status, "ready_for_review");
});

test("final review supports legacy needs_admin_input drafts without a reopen transition", async () => {
  const service = new IngestionReviewService(
    {
      getById: async () => ({
        id: ingestionId,
        songRequestId: "507f191e810c19729de860eb",
        status: "needs_admin_input",
        revision: 9,
      }),
    } as any,
    {
      getById: async () => draft(),
      update: async () => draft({ revision: 5 }),
    } as any,
  );

  const result = await service.save(ingestionId, {
    draftId,
    draftRevision: 4,
    songName: "Song",
    burmeseLyrics: "စာသား",
    romanized: "Romanized.",
    meaning: "Meaning.",
    about: "About.",
    whenToListen: "When.",
    genre: null,
    albumName: null,
    spotifyTrackId: null,
    spotifyLink: null,
    appleMusicLink: null,
    youtubeLinks: null,
    imageLink: null,
  });

  assert.equal(result.ingestion.status, "needs_admin_input");
});

test("final review rejects workflow states before generation is complete", async () => {
  const service = new IngestionReviewService(
    { getById: async () => ({ id: ingestionId, status: "awaiting_source" }) } as any,
    {} as any,
  );

  await assert.rejects(
    () => service.save(ingestionId, {
      draftId,
      draftRevision: 4,
      songName: "Song",
      burmeseLyrics: "စာသား",
      romanized: "Romanized.",
      meaning: "Meaning.",
      about: "About.",
      whenToListen: "When.",
      genre: null,
      albumName: null,
      spotifyTrackId: null,
      spotifyLink: null,
      appleMusicLink: null,
      youtubeLinks: null,
      imageLink: null,
    }),
    IngestionReviewStateError,
  );
});
