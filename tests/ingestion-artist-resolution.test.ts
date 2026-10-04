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

function ingestion(status = "ready_for_review") {
  return {
    id: ingestionId,
    songRequestId: "507f191e810c19729de860ec",
    status,
    revision: 8,
  };
}

test("artist resolution remains directly editable during final review", async () => {
  let currentDraft = draft({
    artists: [
      { kind: "unresolved", name: "Requested Artist" },
      { kind: "unresolved", name: "Second Singer" },
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
    { getBySlug: async () => canonicalArtist() } as any,
  );

  const result = await service.resolve(ingestionId, {
    draftId,
    draftRevision: 4,
    artistIndex: 1,
    artistSlug: "canonical-artist",
  });

  assert.deepEqual(result.artists[1], {
    kind: "resolved",
    artistId,
    name: "Canonical Artist",
    slug: "canonical-artist",
  });
});

test("final review supports multiple unresolved name-only artists", async () => {
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

test("artist list rejects duplicate names and invalid indexes", async () => {
  const duplicate = new IngestionArtistResolutionService(
    { getById: async () => ingestion() } as any,
    { getById: async () => draft() } as any,
    {} as any,
  );

  await assert.rejects(
    () => duplicate.add(ingestionId, {
      draftId,
      draftRevision: 4,
      artistName: "requested artist",
    }),
    DraftArtistResolutionError,
  );

  await assert.rejects(
    () => duplicate.remove(ingestionId, {
      draftId,
      draftRevision: 4,
      artistIndex: 4,
    }),
    DraftArtistResolutionError,
  );
});

test("artist management rejects states before final review/admin input", async () => {
  const service = new IngestionArtistResolutionService(
    { getById: async () => ingestion("awaiting_source") } as any,
    {} as any,
    {} as any,
  );

  await assert.rejects(
    () => service.add(ingestionId, {
      draftId,
      draftRevision: 4,
      artistName: "Artist",
    }),
    IngestionArtistResolutionStateError,
  );
});

test("legacy needs_admin_input drafts remain artist-editable", async () => {
  let currentDraft = draft();
  const service = new IngestionArtistResolutionService(
    { getById: async () => ingestion("needs_admin_input") } as any,
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
    artistName: "Legacy Featured Singer",
  });

  assert.equal(result.artists.length, 2);
});
