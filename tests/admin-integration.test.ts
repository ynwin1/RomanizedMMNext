import test from "node:test";
import assert from "node:assert/strict";

import { AdminReadService } from "@/modules/admin";
import { SongService } from "@/modules/songs/application/song.service";
import type { ISongRepository } from "@/modules/songs/application/song.repository";
import type { SongEntity } from "@/modules/songs/domain/song.types";
import type { SongEditRecord } from "@/modules/songs/application/song.dto";
import { ArtistService } from "@/modules/artists/application/artist.service";
import type { IArtistRepository } from "@/modules/artists/application/artist.repository";
import type { ArtistEntity } from "@/modules/artists/domain/artist.types";
import type { ArtistEditRecord } from "@/modules/artists/application/artist.dto";
import { SongRequestService } from "@/modules/requests/application/song-request.service";
import type { ISongRequestRepository } from "@/modules/requests/application/song-request.repository";
import type { SongRequestEntity, SongRequestStatus } from "@/modules/requests/domain/song-request.types";
import type { AdminSongRequestDetail } from "@/modules/requests/application/song-request.dto";
import { createSongActionHandler } from "@/app/admin/songs/song-action-handler";
import { createArtistActionHandler } from "@/app/admin/artists/artist-action-handler";
import { createRequestActionHandler } from "@/app/admin/requests/request-action-handler";
import { adminPage, type AdminListQuery } from "@/shared/admin-list";
import type { AdminRequestQuery } from "@/modules/requests/application/song-request.admin-query";

const admin = { userId: "admin-integration", role: "admin" as const };
const requestId = "507f1f77bcf86cd799439011";

class MemorySongs implements ISongRepository {
  private records = new Map<number, SongEntity & { revision: number }>();

  async create(input: Parameters<ISongRepository["create"]>[0], updatedBy?: string) {
    const entity = { id: "song-" + input.mmid, ...input, updatedBy, revision: 0 };
    this.records.set(input.mmid, entity);
    return entity;
  }

  async createPublished(input: Parameters<ISongRepository["create"]>[0], _sourceIngestionId: string, updatedBy?: string) {
    return this.create(input, updatedBy);
  }

  async findBySourceIngestionId() { return null; }

  async nextMmid() {
    return Math.max(0, ...this.records.keys()) + 1;
  }

  async findForEdit(mmid: number): Promise<SongEditRecord | null> {
    const song = this.records.get(mmid);
    return song ? { ...song, revision: song.revision } : null;
  }

  async update(mmid: number, revision: number, input: Parameters<ISongRepository["update"]>[2], updatedBy?: string) {
    const current = this.records.get(mmid);
    if (!current || current.revision !== revision) return null;
    const next = { ...current, ...input, updatedBy, revision: revision + 1 };
    this.records.set(mmid, next);
    return next;
  }

  async listAdmin(query: AdminListQuery) {
    const all = [...this.records.values()]
      .filter(song => !query.q || song.songName.toLowerCase().includes(query.q.toLowerCase()))
      .map(song => ({ mmid: song.mmid, songName: song.songName, artistName: song.artistName, genre: song.genre, createdAt: song.createdAt }));
    return adminPage(all.slice((query.page - 1) * query.limit, query.page * query.limit), all.length, query);
  }
  async countAdmin() { return this.records.size; }
  async findByMmid(mmid: number) { return this.records.get(mmid) ?? null; }
  async searchByTitle() { return []; }
  async findRandom() { return null; }
  async findLatest(limit: number) { return [...this.records.values()].slice(0, limit); }
  async findByMmids(mmids: number[]) { return mmids.flatMap(id => this.records.get(id) ?? []); }
  async listForSitemap() { return []; }
  async listCatalogue() { return []; }
  async listGuessLyricsSongs() { return []; }
  async listGuessSongRecords() { return []; }
  async findByArtistName() { return []; }
  async listLyricsMigrationCandidates() { return []; }
  async setLyricsV2IfAbsent() { return true; }
}

class MemoryArtists implements IArtistRepository {
  private records = new Map<string, ArtistEntity & { revision: number }>();

  async create(input: Parameters<IArtistRepository["create"]>[0], updatedBy?: string) {
    const entity = { id: "artist-" + input.slug, likes: input.likes ?? 0, ...input, updatedBy, revision: 0 };
    this.records.set(input.slug, entity);
    return entity;
  }

  async findForEdit(slug: string): Promise<ArtistEditRecord | null> {
    const artist = this.records.get(slug);
    return artist ? { ...artist, revision: artist.revision } : null;
  }

  async update(slug: string, revision: number, input: Parameters<IArtistRepository["update"]>[2], updatedBy?: string) {
    const current = this.records.get(slug);
    if (!current || current.revision !== revision) return null;
    const next = { ...current, ...input, updatedBy, revision: revision + 1 };
    this.records.set(slug, next);
    return next;
  }

  async listAdmin(query: AdminListQuery) {
    const all = [...this.records.values()]
      .filter(artist => !query.q || artist.name.toLowerCase().includes(query.q.toLowerCase()))
      .map(artist => ({ name: artist.name, slug: artist.slug, type: artist.type, musicGenre: artist.musicGenre, songCount: artist.songs.length }));
    return adminPage(all.slice((query.page - 1) * query.limit, query.page * query.limit), all.length, query);
  }
  async countAdmin() { return this.records.size; }
  async findBySlug(slug: string) { return this.records.get(slug) ?? null; }
  async findFirstBySlugs(slugs: string[]) { return slugs.map(slug => this.records.get(slug)).find(Boolean) ?? null; }
  async listCatalogue() { return { artists: [], totalPages: 0 }; }

  async addSongReference(slug: string, mmid: number, updatedBy?: string) {
    const artist = this.records.get(slug);
    if (!artist) return null;
    const next = {
      ...artist,
      songs: artist.songs.includes(mmid) ? artist.songs : [...artist.songs, mmid],
      updatedBy,
    };
    this.records.set(slug, next);
    return next;
  }
}

class MemoryRequests implements ISongRequestRepository {
  private record: (SongRequestEntity & { revision: number }) | null = null;

  async create(input: Parameters<ISongRequestRepository["create"]>[0]) {
    this.record = { id: requestId, ...input, status: "pending", revision: 0 };
    return this.record;
  }

  async listAdmin(query: AdminRequestQuery) {
    const records = this.record && (!query.status || this.record.status === query.status) ? [this.record] : [];
    return adminPage(records.map(request => ({
      id: request.id,
      songName: request.songName,
      artist: request.artist,
      status: (request.status ?? "pending") as SongRequestStatus,
      createdAt: request.createdAt,
    })), records.length, query);
  }

  async countAdmin(status?: SongRequestStatus) {
    if (!this.record) return 0;
    return !status || this.record.status === status ? 1 : 0;
  }

  async listQueue() { return this.record ? [{ songName: this.record.songName, artist: this.record.artist }] : []; }

  async findAdminDetail(id: string): Promise<AdminSongRequestDetail | null> {
    if (!this.record || this.record.id !== id) return null;
    return { ...this.record, status: (this.record.status ?? "pending") as SongRequestStatus, revision: this.record.revision };
  }

  async updateStatus(id: string, revision: number, status: SongRequestStatus, updatedBy?: string) {
    if (!this.record || this.record.id !== id || this.record.revision !== revision) return null;
    this.record = { ...this.record, status, updatedBy, revision: revision + 1 };
    return this.record;
  }

  async findById(id: string) { return this.record?.id === id ? this.record : null; }
}

function songForm(songName: string) {
  const form = new FormData();
  form.set("mmid", "17");
  form.set("songName", songName);
  form.set("artistName", JSON.stringify([{ name: "Artist", slug: "artist" }]));
  form.set("genre", "Pop");
  form.set("about", "About");
  form.set("whenToListen", "Anytime");
  form.set("lyrics", "lyrics");
  form.set("romanized", "romanized");
  form.set("burmese", "မြန်မာ");
  form.set("meaning", "meaning");
  return form;
}

function artistForm(name: string) {
  const form = new FormData();
  form.set("name", name);
  form.set("slug", "artist");
  form.set("imageLink", "https://example.com/artist.jpg");
  form.set("type", "Singer");
  form.set("musicGenre", "Pop");
  form.set("songs", "17");
  return form;
}

test("admin integration flow covers protected reads, song/artist create+edit, and request review/update", async () => {
  const songsRepo = new MemorySongs();
  const artistsRepo = new MemoryArtists();
  const requestsRepo = new MemoryRequests();
  const songs = new SongService(songsRepo);
  const artists = new ArtistService(artistsRepo);
  const requests = new SongRequestService(requestsRepo);
  const authorize = async () => admin;
  const reads = new AdminReadService(authorize, songs, artists, requests);

  assert.deepEqual(await reads.dashboard(), {
    songs: 0, artists: 0, requests: 0, pendingRequests: 0, recentSongs: [],
  });

  const songActions = createSongActionHandler({
    authorize,
    songs,
    saved: id => { throw new Error("saved-song:" + id); },
    logFailure: error => { throw error; },
  });
  await assert.rejects(() => songActions.create({}, songForm("Integration Song")), /saved-song:17/);
  assert.equal((await reads.listSongs({ q: "Integration", page: 1, limit: 20 })).items[0]?.songName, "Integration Song");
  const songEdit = await songs.getSongForEdit(17);
  await assert.rejects(() => songActions.update(17, songEdit.revision, {}, songForm("Edited Song")), /saved-song:17/);
  assert.equal((await songs.getSongForEdit(17)).songName, "Edited Song");
  assert.equal((await songs.getSongForEdit(17)).updatedBy, admin.userId);

  const artistActions = createArtistActionHandler({
    authorize,
    artists,
    saved: slug => { throw new Error("saved-artist:" + slug); },
    logFailure: error => { throw error; },
  });
  await assert.rejects(() => artistActions.create({}, artistForm("Integration Artist")), /saved-artist:artist/);
  assert.equal((await reads.listArtists({ q: "Integration", page: 1, limit: 20 })).items[0]?.name, "Integration Artist");
  const artistEdit = await artists.getArtistForEdit("artist");
  await assert.rejects(() => artistActions.update("artist", artistEdit.revision, {}, artistForm("Edited Artist")), /saved-artist:artist/);
  assert.equal((await artists.getArtistForEdit("artist")).name, "Edited Artist");
  assert.equal((await artists.getArtistForEdit("artist")).updatedBy, admin.userId);

  await requests.create({ songName: "Requested Song", artist: "Requested Artist" });
  const pending = await reads.listRequests({ status: "pending", page: 1, limit: 20 });
  assert.equal(pending.items.length, 1);
  const request = await requests.getAdminDetail(requestId);

  const requestActions = createRequestActionHandler({
    authorize,
    requests,
    acceptRequest: async () => ({ ingestion: { id: "507f191e810c19729de860ea" } }),
    saved: id => { throw new Error("saved-request:" + id); },
    accepted: () => { throw new Error("unexpected accepted redirect"); },
    rejected: () => { throw new Error("unexpected rejected redirect"); },
    logFailure: error => { throw error; },
  });
  const statusForm = new FormData();
  statusForm.set("status", "reviewing");
  await assert.rejects(() => requestActions.update(requestId, request.revision, {}, statusForm), /saved-request:/);

  const reviewed = await requests.getAdminDetail(requestId);
  assert.equal(reviewed.status, "reviewing");
  assert.equal(reviewed.updatedBy, admin.userId);
  assert.equal((await reads.listRequests({ status: "pending", page: 1, limit: 20 })).items.length, 0);
  assert.equal((await reads.listRequests({ status: "reviewing", page: 1, limit: 20 })).items.length, 1);
});

test("denied integration reads never touch content services", async () => {
  let contentCalls = 0;
  const denied = async () => { throw new Error("denied"); };
  const reads = new AdminReadService(denied, {
    getAdminCount: async () => { contentCalls++; return 0; },
    getAdminList: async () => { contentCalls++; return adminPage([], 0, { page: 1, limit: 20, q: "" }); },
    analyzeLyricsMigration: async () => {
      contentCalls++;
      return { total: 0, counts: { SAFE: 0, WARNING: 0, INVALID: 0, MANUAL_REVIEW: 0 }, assessments: [] };
    },
    analyzeLyricsMigrationRepairs: async () => {
      contentCalls++;
      return { total: 0, counts: { READY: 0, DETERMINISTIC_REPAIR: 0, AI_MEANING_ALIGNMENT: 0, AI_ROMANIZATION_REPAIR: 0, MANUAL_REVIEW: 0 }, plans: [] };
    },
  }, {
    getAdminCount: async () => { contentCalls++; return 0; },
    getAdminList: async () => { contentCalls++; return adminPage([], 0, { page: 1, limit: 20, q: "" }); },
  }, {
    getAdminCount: async () => { contentCalls++; return 0; },
    getAdminList: async () => { contentCalls++; return adminPage([], 0, { page: 1, limit: 20, q: "" }); },
  });

  await assert.rejects(() => reads.listSongs({}), /denied/);
  await assert.rejects(() => reads.listArtists({}), /denied/);
  await assert.rejects(() => reads.listRequests({}), /denied/);
  await assert.rejects(() => reads.lyricsMigrationReadiness(), /denied/);
  await assert.rejects(() => reads.lyricsMigrationRepairs(), /denied/);
  assert.equal(contentCalls, 0);
});
