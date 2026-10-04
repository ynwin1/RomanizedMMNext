import test from "node:test";
import assert from "node:assert/strict";
import type { ContentDraftRecord } from "@/modules/content-drafts";
import { PublishingService } from "@/modules/publishing/application/publishing.service";
import {
  DraftNotPublishableError,
  PublicationStateError,
} from "@/modules/publishing/application/publishing.error";
import {
  DuplicatePublishedSongError,
  DuplicateSongError,
} from "@/modules/songs/application/song-write.error";

const ingestionId = "507f1f77bcf86cd799439011";
const requestId = "507f191e810c19729de860ea";
const draftId = "507f191e810c19729de860eb";

function draft(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
  return {
    id: draftId,
    ingestionId,
    identity: { songName: "Published Song" },
    source: { burmeseLyrics: "မြန်မာစာ" },
    generated: {
      romanized: "Myan mar sar.",
      meaning: "Burmese words.",
      about: "A song about something.",
      whenToListen: "When you want to listen.",
    },
    metadata: {
      genre: "Pop",
      requestedBy: "Listener",
      youtubeLinks: ["https://youtu.be/example"],
    },
    artists: [
      {
        kind: "resolved",
        artistId: "507f191e810c19729de860ec",
        name: "Known Artist",
        slug: "known-artist",
      },
      {
        kind: "unresolved",
        name: "New Singer",
      },
    ],
    revision: 7,
    ...overrides,
  };
}

function ingestion(status = "ready_for_review", revision = 4) {
  return {
    id: ingestionId,
    songRequestId: requestId,
    status,
    revision,
  };
}

const publishedSong = {
  id: "song-db-id",
  mmid: 200,
  songName: "Published Song",
  artistName: [
    { name: "Known Artist", slug: "known-artist" },
    { name: "New Singer" },
  ],
  genre: "Pop",
  about: "A song about something.",
  whenToListen: "When you want to listen.",
  lyrics: "မြန်မာစာ",
  romanized: "Myan mar sar.",
  burmese: "မြန်မာစာ",
  meaning: "Burmese words.",
  isRequested: true,
};

test("publish creates canonical song, links resolved artists, completes request, then approves ingestion", async () => {
  const calls: string[] = [];
  let createInput: any;

  const service = new PublishingService(
    {
      getById: async () => ingestion(),
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        calls.push("ingestion:" + next);
        return { ...ingestion("approved", 5), status: next as any };
      },
    } as any,
    { getByIngestionId: async () => draft() } as any,
    {
      getPublishedByIngestion: async () => null,
      getNextMmid: async () => 200,
      createPublishedSong: async (input: any, sourceId: string, actor?: string) => {
        createInput = input;
        assert.equal(sourceId, ingestionId);
        assert.equal(actor, "admin-1");
        calls.push("song");
        return publishedSong;
      },
    } as any,
    {
      addSongReference: async (slug: string, mmid: number, actor?: string) => {
        assert.equal(slug, "known-artist");
        assert.equal(mmid, 200);
        assert.equal(actor, "admin-1");
        calls.push("artist:" + slug);
        return {} as any;
      },
    } as any,
    {
      getAdminDetail: async () => ({
        id: requestId,
        songName: "Requested Song",
        artist: "Known Artist",
        status: "accepted",
        revision: 3,
      }),
      updateStatus: async (_id: unknown, revision: number, status: any, actor?: string) => {
        assert.equal(revision, 3);
        assert.equal(status, "completed");
        assert.equal(actor, "admin-1");
        calls.push("request:completed");
        return {} as any;
      },
    } as any,
  );

  const result = await service.publish(ingestionId, "admin-1");

  assert.equal(result.mmid, 200);
  assert.equal(createInput.lyrics, "မြန်မာစာ");
  assert.equal(createInput.burmese, "မြန်မာစာ");
  assert.equal(createInput.isRequested, true);
  assert.deepEqual(createInput.artistName, [
    { name: "Known Artist", slug: "known-artist" },
    { name: "New Singer" },
  ]);
  assert.deepEqual(calls, [
    "song",
    "artist:known-artist",
    "request:completed",
    "ingestion:approved",
  ]);
});

test("publish resumes from an existing canonical song instead of creating a duplicate", async () => {
  let creates = 0;
  let nextIds = 0;
  const calls: string[] = [];

  const service = new PublishingService(
    {
      getById: async () => ingestion(),
      transition: async () => {
        calls.push("approve");
        return {} as any;
      },
    } as any,
    { getByIngestionId: async () => draft() } as any,
    {
      getPublishedByIngestion: async () => publishedSong,
      getNextMmid: async () => { nextIds++; return 201; },
      createPublishedSong: async () => { creates++; return publishedSong; },
    } as any,
    {
      addSongReference: async () => {
        calls.push("artist");
        return {} as any;
      },
    } as any,
    {
      getAdminDetail: async () => ({
        id: requestId,
        status: "completed",
        revision: 4,
      } as any),
      updateStatus: async () => {
        calls.push("request-write");
        return {} as any;
      },
    } as any,
  );

  const result = await service.publish(ingestionId);

  assert.equal(result.mmid, 200);
  assert.equal(creates, 0);
  assert.equal(nextIds, 0);
  assert.deepEqual(calls, ["artist", "approve"]);
});

test("publish retries a concurrent MMID collision", async () => {
  const ids = [200, 201];
  let creates = 0;

  const service = new PublishingService(
    {
      getById: async () => ingestion("approved"),
      transition: async () => { throw new Error("should not transition"); },
    } as any,
    { getByIngestionId: async () => draft() } as any,
    {
      getPublishedByIngestion: async () => null,
      getNextMmid: async () => ids.shift()!,
      createPublishedSong: async (input: any) => {
        creates++;
        if (creates === 1) throw new DuplicateSongError();
        return { ...publishedSong, mmid: input.mmid };
      },
    } as any,
    { addSongReference: async () => ({} as any) } as any,
    {
      getAdminDetail: async () => ({ id: requestId, status: "completed", revision: 4 } as any),
      updateStatus: async () => ({} as any),
    } as any,
  );

  const result = await service.publish(ingestionId);
  assert.equal(result.mmid, 201);
  assert.equal(creates, 2);
});

test("publish recovers a same-ingestion create race through source ingestion identity", async () => {
  let lookups = 0;

  const service = new PublishingService(
    {
      getById: async () => ingestion("approved"),
      transition: async () => { throw new Error("should not transition"); },
    } as any,
    { getByIngestionId: async () => draft() } as any,
    {
      getPublishedByIngestion: async () => {
        lookups++;
        return lookups === 1 ? null : publishedSong;
      },
      getNextMmid: async () => 200,
      createPublishedSong: async () => {
        throw new DuplicatePublishedSongError();
      },
    } as any,
    { addSongReference: async () => ({} as any) } as any,
    {
      getAdminDetail: async () => ({ id: requestId, status: "completed", revision: 4 } as any),
      updateStatus: async () => ({} as any),
    } as any,
  );

  const result = await service.publish(ingestionId);
  assert.equal(result.mmid, 200);
  assert.equal(lookups, 2);
});

test("publish rejects incomplete drafts before canonical writes", async () => {
  let writes = 0;
  const service = new PublishingService(
    { getById: async () => ingestion() } as any,
    { getByIngestionId: async () => draft({ metadata: {} }) } as any,
    {
      getPublishedByIngestion: async () => { writes++; return null; },
      getNextMmid: async () => { writes++; return 200; },
      createPublishedSong: async () => { writes++; return publishedSong; },
    } as any,
    {} as any,
    {} as any,
  );

  await assert.rejects(() => service.publish(ingestionId), DraftNotPublishableError);
  assert.equal(writes, 0);
});

test("publish rejects workflow states that are not reviewed or already approved", async () => {
  const service = new PublishingService(
    { getById: async () => ingestion("failed") } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  await assert.rejects(() => service.publish(ingestionId), PublicationStateError);
});
