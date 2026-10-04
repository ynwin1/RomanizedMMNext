import test from "node:test";
import assert from "node:assert/strict";
import type { ContentDraftRecord } from "@/modules/content-drafts";
import { IngestionArtistResolutionService } from "@/modules/ingestions/application/ingestion-artist-resolution.service";
import {
  DraftArtistResolutionError,
  IngestionArtistResolutionStateError,
} from "@/modules/ingestions/application/ingestion-artist-resolution.error";

const ingestionId = "507f1f77bcf86cd799439011";
const draftId = "507f191e810c19729de860ea";
const artistId = "507f191e810c19729de860eb";

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
    metadata: { genre: "Pop" },
    artists: [{ kind: "unresolved", name: "Requested Artist" }],
    revision: 4,
    ...overrides,
  };
}

function canonicalArtist() {
  return {
    id: artistId,
    name: "Canonical Artist",
    slug: "canonical-artist",
    imageLink: "https://example.com/artist.jpg",
    type: "Singer",
    musicGenre: ["Pop"],
    songs: [],
    likes: 0,
  };
}

function ingestion(status = "needs_admin_input") {
  return {
    id: ingestionId,
    songRequestId: "507f191e810c19729de860ec",
    status,
    revision: 8,
  };
}

test("artist resolution replaces only the selected unresolved entry and does not auto-advance", async () => {
  let currentDraft = draft({
    artists: [
      { kind: "unresolved", name: "Requested Artist" },
      { kind: "unresolved", name: "Second Singer" },
    ],
  });
  let transitions = 0;

  const service = new IngestionArtistResolutionService(
    {
      getById: async () => ingestion(),
      transition: async () => { transitions++; throw new Error("should not transition"); },
    } as any,
    {
      getById: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = draft({ artists: patch.artists, revision: 5 });
        return currentDraft;
      },
    } as any,
    { getBySlug: async () => canonicalArtist() } as any,
  );

  const result = await service.resolve(ingestionId, {
    draftId,
    draftRevision: 4,
    artistIndex: 1,
    artistSlug: "canonical-artist",
  });

  assert.equal(transitions, 0);
  assert.deepEqual(result.artists, [
    { kind: "unresolved", name: "Requested Artist" },
    {
      kind: "resolved",
      artistId,
      name: "Canonical Artist",
      slug: "canonical-artist",
    },
  ]);
});

test("artist list supports adding multiple unresolved name-only artists", async () => {
  let currentDraft = draft();
  const service = new IngestionArtistResolutionService(
    { getById: async () => ingestion() } as any,
    {
      getById: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = draft({ artists: patch.artists, revision: 5 });
        return currentDraft;
      },
    } as any,
    {} as any,
  );

  const result = await service.add(ingestionId, {
    draftId,
    draftRevision: 4,
    artistName: "Featured Singer",
  });

  assert.deepEqual(result.artists, [
    { kind: "unresolved", name: "Requested Artist" },
    { kind: "unresolved", name: "Featured Singer" },
  ]);
});

test("artist list rejects duplicate names case-insensitively", async () => {
  const service = new IngestionArtistResolutionService(
    { getById: async () => ingestion() } as any,
    { getById: async () => draft() } as any,
    {} as any,
  );

  await assert.rejects(
    () => service.add(ingestionId, {
      draftId,
      draftRevision: 4,
      artistName: "requested artist",
    }),
    DraftArtistResolutionError,
  );
});

test("artist list can remove resolved or unresolved entries", async () => {
  let currentDraft = draft({
    artists: [
      { kind: "unresolved", name: "Requested Artist" },
      {
        kind: "resolved",
        artistId,
        name: "Canonical Artist",
        slug: "canonical-artist",
      },
    ],
  });

  const service = new IngestionArtistResolutionService(
    { getById: async () => ingestion() } as any,
    {
      getById: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = draft({ artists: patch.artists, revision: 5 });
        return currentDraft;
      },
    } as any,
    {} as any,
  );

  const result = await service.remove(ingestionId, {
    draftId,
    draftRevision: 4,
    artistIndex: 0,
  });

  assert.deepEqual(result.artists, [{
    kind: "resolved",
    artistId,
    name: "Canonical Artist",
    slug: "canonical-artist",
  }]);
});

test("confirm accepts unresolved name-only artists and advances when metadata is complete", async () => {
  let current = ingestion();
  const transitions: string[] = [];

  const service = new IngestionArtistResolutionService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        transitions.push(String(next));
        current = { ...current, status: String(next), revision: 9 };
        return current;
      },
    } as any,
    { getById: async () => draft() } as any,
    {} as any,
  );

  const result = await service.confirm(ingestionId, { draftId }, "admin-1");

  assert.deepEqual(transitions, ["ready_for_review"]);
  assert.equal(result.completeness.complete, true);
  assert.equal(result.ingestion.status, "ready_for_review");
});

test("confirm rejects empty artist list or incomplete metadata", async () => {
  const baseIngestions = { getById: async () => ingestion() } as any;

  const empty = new IngestionArtistResolutionService(
    baseIngestions,
    { getById: async () => draft({ artists: [] }) } as any,
    {} as any,
  );
  await assert.rejects(
    () => empty.confirm(ingestionId, { draftId }),
    /Add at least one artist/,
  );

  const noGenre = new IngestionArtistResolutionService(
    baseIngestions,
    { getById: async () => draft({ metadata: {} }) } as any,
    {} as any,
  );
  await assert.rejects(
    () => noGenre.confirm(ingestionId, { draftId }),
    /Complete required factual metadata/,
  );
});

test("artist management rejects edits outside needs_admin_input and invalid draft/index", async () => {
  const wrongState = new IngestionArtistResolutionService(
    { getById: async () => ingestion("ready_for_review") } as any,
    {} as any,
    {} as any,
  );

  await assert.rejects(
    () => wrongState.add(ingestionId, {
      draftId,
      draftRevision: 4,
      artistName: "Artist",
    }),
    IngestionArtistResolutionStateError,
  );

  const wrongDraft = new IngestionArtistResolutionService(
    { getById: async () => ingestion() } as any,
    { getById: async () => draft({ ingestionId: "507f191e810c19729de860ff" }) } as any,
    {} as any,
  );

  await assert.rejects(
    () => wrongDraft.remove(ingestionId, {
      draftId,
      draftRevision: 4,
      artistIndex: 0,
    }),
    DraftArtistResolutionError,
  );

  const missingIndex = new IngestionArtistResolutionService(
    { getById: async () => ingestion() } as any,
    { getById: async () => draft() } as any,
    {} as any,
  );

  await assert.rejects(
    () => missingIndex.remove(ingestionId, {
      draftId,
      draftRevision: 4,
      artistIndex: 4,
    }),
    DraftArtistResolutionError,
  );
});


test("ready_for_review can be reopened to edit admin input", async () => {
  let current = ingestion("ready_for_review");
  const transitions: string[] = [];

  const service = new IngestionArtistResolutionService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        transitions.push(String(next));
        current = { ...current, status: String(next), revision: 9 };
        return current;
      },
    } as any,
    { getById: async () => draft() } as any,
    {} as any,
  );

  const result = await service.reopen(ingestionId, { draftId }, "admin-1");

  assert.deepEqual(transitions, ["needs_admin_input"]);
  assert.equal(result.ingestion.status, "needs_admin_input");
});

test("reopen rejects ingestions that are not ready_for_review", async () => {
  const service = new IngestionArtistResolutionService(
    { getById: async () => ingestion("needs_admin_input") } as any,
    {} as any,
    {} as any,
  );

  await assert.rejects(
    () => service.reopen(ingestionId, { draftId }),
    IngestionArtistResolutionStateError,
  );
});
