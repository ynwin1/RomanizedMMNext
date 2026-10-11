import test from "node:test";
import assert from "node:assert/strict";
import {ZodError} from "zod";
import {PlaylistService} from "@/modules/playlists/application/playlist.service";
import type {IPlaylistRepository, PlaylistWrite} from "@/modules/playlists/application/playlist.repository";
import {parsePlaylistUrl, validatePlaylistInput} from "@/modules/playlists/application/playlist.validation";
import {DuplicatePlaylistError, PlaylistConflictError} from "@/modules/playlists/application/playlist-write.error";
import type {PlaylistEntity} from "@/modules/playlists/domain/playlist.types";
import Playlist from "@/modules/playlists/infrastructure/playlist.model";
import {MongoPlaylistRepository} from "@/modules/playlists/infrastructure/playlist.repository";
import {NotFoundError} from "@/shared/errors/not-found.error";

const database = require("@/infrastructure/database/mongodb") as typeof import("@/infrastructure/database/mongodb");
const spotifyId = "37i9dQZF1DXcBWIGoYBM5M";
const entityId = "507f191e810c19729de860ea";
const draft = {
  platform: "spotify",
  url: `https://open.spotify.com/playlist/${spotifyId}?si=shared`,
  title: "  Myanmar Rock  ",
  description: "Classic hits",
  genres: ["rock", "pop"],
  sortOrder: 2,
};

test("playlist URL parsing recognizes each platform and canonicalizes shared Spotify links", () => {
  assert.deepEqual(parsePlaylistUrl("spotify", draft.url), {
    id: spotifyId, url: `https://open.spotify.com/playlist/${spotifyId}`,
  });
  assert.deepEqual(parsePlaylistUrl("youtube", "https://music.youtube.com/playlist?list=PL123456789ABC&feature=share"), {
    id: "PL123456789ABC", url: "https://www.youtube.com/playlist?list=PL123456789ABC",
  });
  assert.deepEqual(parsePlaylistUrl("apple_music", "https://music.apple.com/us/playlist/myanmar-rock/pl.a1234abcd"), {
    id: "pl.a1234abcd", url: "https://music.apple.com/us/playlist/myanmar-rock/pl.a1234abcd",
  });
  for (const url of [
    `http://open.spotify.com/playlist/${spotifyId}`,
    `https://open.spotify.com.evil.test/playlist/${spotifyId}`,
    `https://evil.test@open.spotify.com/playlist/${spotifyId}`,
    `https://open.spotify.com/track/${spotifyId}`,
    `https://open.spotify.com:444/playlist/${spotifyId}`,
  ]) assert.equal(parsePlaylistUrl("spotify", url), null);
  assert.equal(parsePlaylistUrl("youtube", draft.url), null);
});

test("playlist validation allows multiple distinct genres but rejects bad metadata and untrusted URLs", () => {
  const content = validatePlaylistInput(draft);
  assert.equal(content.title, "Myanmar Rock");
  assert.equal(content.platformPlaylistId, spotifyId);
  assert.equal(content.url, `https://open.spotify.com/playlist/${spotifyId}`);
  assert.deepEqual(content.genres, ["rock", "pop"]);
  for (const invalid of [
    {...draft, genres: []}, {...draft, genres: ["rock", "rock"]},
    {...draft, genres: ["made-up"]}, {...draft, imageUrl: "http://example.com/image.jpg"},
    {...draft, url: "https://example.com/playlist/123"},
    {...draft, platform: "unknown"}, {...draft, status: "published"},
  ]) assert.throws(() => validatePlaylistInput(invalid), ZodError);
});

test("playlist service validates writes, limits public lists, and detects conflicting edits", async () => {
  const input = validatePlaylistInput(draft);
  const saved: PlaylistEntity = {...input, id: entityId, status: "draft", revision: 0};
  let created: PlaylistWrite | undefined;
  let listedGenre = "";
  let listedLimit = 0;
  const repo: IPlaylistRepository = {
    create: async write => {created = write; return saved;},
    findById: async () => saved,
    findByPlatformId: async () => saved,
    listAdmin: async () => [saved],
    listPublishedByGenre: async (genre, limit) => {listedGenre = genre; listedLimit = limit; return [];},
    update: async () => null,
    setStatus: async () => null,
  };
  const service = new PlaylistService(repo);
  assert.equal((await service.create(draft)).status, "draft");
  assert.equal(created?.platformPlaylistId, spotifyId);
  assert.deepEqual(await service.listPublishedByGenre("rock"), []);
  assert.equal(listedGenre, "rock");
  assert.equal(listedLimit, 5);
  await assert.rejects(() => service.listPublishedByGenre("wrong"), ZodError);
  await assert.rejects(() => service.listPublishedByGenre("rock", 100));
  await assert.rejects(() => service.update(entityId, 0, draft), PlaylistConflictError);
  await assert.rejects(() => service.setStatus(entityId, 0, "published"), PlaylistConflictError);
  await assert.rejects(() => service.setStatus(entityId, 0, "invalid"), ZodError);
  await assert.rejects(() => service.getForAdmin("not-object-id"), ZodError);
  repo.findById = async () => null;
  await assert.rejects(() => service.getForAdmin(entityId), NotFoundError);
});

test("playlist repository creates drafts and maps the unique platform index to a domain error", async t => {
  t.mock.method(database, "default", async () => {});
  const input = validatePlaylistInput(draft);
  let document: Record<string, unknown> | undefined;
  t.mock.method(Playlist, "create", async (data: Record<string, unknown>) => {
    document = data;
    return {toObject: () => ({_id: entityId, ...data, __v: 0})};
  });
  const repo = new MongoPlaylistRepository();
  const created = await repo.create(input, "admin-1");
  assert.equal(created.id, entityId);
  assert.equal(created.revision, 0);
  assert.equal(created.status, "draft");
  assert.equal(document?.updatedBy, "admin-1");
  assert.equal(document?.platformPlaylistId, spotifyId);

  t.mock.method(Playlist, "create", async () => {throw {code: 11000, keyPattern: {platform: 1, platformPlaylistId: 1}};});
  await assert.rejects(() => repo.create(input), DuplicatePlaylistError);
});

test("playlist repository updates use optimistic revisions, clear optional data, and never upsert", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, mutation: unknown, options: unknown;
  t.mock.method(Playlist, "findOneAndUpdate", (f: unknown, u: unknown, o: unknown) => {
    filter = f; mutation = u; options = o;
    return {lean: async () => ({_id: entityId, ...validatePlaylistInput(draft), status: "published", __v: 3})};
  });
  const input = validatePlaylistInput({...draft, description: undefined});
  const saved = await new MongoPlaylistRepository().update(entityId, 2, input, "admin-1");
  assert.equal(saved?.revision, 3);
  assert.equal((filter as {__v: number}).__v, 2);
  assert.deepEqual(options, {new: true, runValidators: true, upsert: false});
  const update = mutation as {$set: Record<string, unknown>; $unset: Record<string, number>; $inc: object};
  assert.equal(update.$set.status, undefined);
  assert.equal(update.$set.updatedBy, "admin-1");
  assert.deepEqual(update.$unset, {description: 1, imageUrl: 1, curator: 1});
  assert.deepEqual(update.$inc, {__v: 1});

  await new MongoPlaylistRepository().setStatus(entityId, 0, "archived");
  assert.ok("$or" in (filter as object));
  assert.deepEqual((mutation as {$set: object}).$set, {status: "archived"});
  assert.equal((options as {upsert: boolean}).upsert, false);
});

test("public playlist queries include only published playlists in the requested genre", async t => {
  t.mock.method(database, "default", async () => {});
  let filter: unknown, sort: unknown, limit: unknown;
  t.mock.method(Playlist, "find", (f: unknown) => {
    filter = f;
    return {sort: (s: unknown) => {sort = s; return {limit: (l: unknown) => {limit = l; return {lean: async () => []};}};}};
  });
  const rows = await new MongoPlaylistRepository().listPublishedByGenre("rock", 5);
  assert.deepEqual(rows, []);
  assert.deepEqual(filter, {status: "published", genres: "rock"});
  assert.deepEqual(sort, {sortOrder: 1, createdAt: -1, _id: 1});
  assert.equal(limit, 5);
});
