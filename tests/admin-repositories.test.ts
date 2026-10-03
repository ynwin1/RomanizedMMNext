import test from "node:test";
import assert from "node:assert/strict";
import Song from "@/modules/songs/infrastructure/song.model";
import Artist from "@/modules/artists/infrastructure/artist.model";
import SongRequest from "@/modules/requests/infrastructure/song-request.model";
import { MongoSongRepository } from "@/modules/songs/infrastructure/song.repository";
import { MongoArtistRepository } from "@/modules/artists/infrastructure/artist.repository";
import { MongoSongRequestRepository } from "@/modules/requests/infrastructure/song-request.repository";

// Mock the connection seam and model query chains: these tests never connect to live Mongo.
const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
type QueryModel = { find: (filter: unknown) => unknown; countDocuments: (filter: unknown) => unknown };
const cases = [
  { name: "songs", model: Song, repo: new MongoSongRepository(), row: { mmid: 17, songName: "Song", artistName: [{ name: "Artist" }], genre: "Pop", lyrics: "private payload" }, expected: { mmid: 17, songName: "Song", artistName: [{ name: "Artist" }], genre: "Pop", createdAt: undefined }, sort: { createdAt: -1, _id: -1 } },
  { name: "artists", model: Artist, repo: new MongoArtistRepository(), row: { name: "Artist", slug: "artist", type: "Singer", songs: [1, 2], musicGenre: ["Pop"], biography: "large payload" }, expected: { name: "Artist", slug: "artist", type: "Singer", songCount: 2, musicGenre: ["Pop"] }, sort: { name: 1, _id: 1 } },
  { name: "requests", model: SongRequest, repo: new MongoSongRequestRepository(), row: { _id: "r1", songName: "Song", artist: "Artist", notifyEmail: "private@example.com" }, expected: { id: "r1", songName: "Song", artist: "Artist", status: "pending", createdAt: undefined }, sort: { createdAt: -1, _id: -1 } },
];
for (const entry of cases) {
  test(entry.name + " admin repository paginates in Mongo, uses matching count filters and a narrow DTO", async t => {
    t.mock.method(database, "default", async () => {});
    const calls: Record<string, unknown> = {};
    const chain = {
      sort(value: unknown) { calls.sort = value; return this; },
      skip(value: unknown) { calls.skip = value; return this; },
      limit(value: unknown) { calls.limit = value; return this; },
      select(value: string) { calls.select = value; return this; },
      async lean() { return [entry.row]; },
    };
    const model = entry.model as unknown as QueryModel;
    t.mock.method(model, "find", (filter: unknown) => { calls.find = filter; return chain; });
    t.mock.method(model, "countDocuments", async (filter: unknown) => { calls.count = filter; return 21; });
    const result = await entry.repo.listAdmin({ page: 2, limit: 20, q: "Song.*" });
    assert.deepEqual(result, { items: [entry.expected], total: 21, page: 2, limit: 20, totalPages: 2 });
    assert.equal(calls.skip, 20);
    assert.equal(calls.limit, 20);
    assert.deepEqual(calls.sort, entry.sort);
    assert.deepEqual(calls.find, calls.count);
    assert.doesNotMatch(String(calls.select), /lyrics|biography|notifyEmail/);
  });
}

test("request pending dashboard count uses the same legacy-status filter as the list", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown;
  const model = SongRequest as unknown as QueryModel;
  t.mock.method(model, "countDocuments", async (value: unknown) => { filter = value; return 3; });
  assert.equal(await new MongoSongRequestRepository().countAdmin("pending"), 3);
  assert.deepEqual(filter, { $and: [{ $or: [{ status: "pending" }, { status: { $exists: false } }, { status: null }] }] });
});
