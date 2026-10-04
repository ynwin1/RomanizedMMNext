import { CreateSongSchema, SongContentSchema, SongIdSchema, SongRevisionSchema } from "./song.validation";
import { SongConflictError } from "./song-write.error";
import type { SongEditRecord } from "./song.dto";
import { AdminListQuerySchema } from "@/shared/admin-list";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRecord } from "./song.dto";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { SongEntity } from "../domain/song.types";
import { withCanonicalLyrics } from "../domain/lyrics.compatibility";
import {
  GuessLyricsSong,
  GuessSongRecord,
  RandomSongResult,
  SitemapSongRecord,
  SongCatalogueRecord,
  SongSearchResult,
  SongSummary,
} from "./song.dto";
import { ISongRepository } from "./song.repository";
import { buildLyricsMigrationReport } from "./lyrics-migration.validator";
import { buildLyricsMigrationRepairReport, planLyricsMigrationRepair } from "./lyrics-migration.repair";
import { parseLyricsV2 } from "./lyrics-v2.validation";
import type { LyricsMigrationExecutionResult, LyricsMigrationRepairReport, LyricsMigrationReport } from "../domain/lyrics-migration.types";

export class SongService {
  constructor(private readonly songs: ISongRepository) {}

  async createSong(input: unknown, updatedBy?: string): Promise<SongEntity> {
    return this.songs.create(CreateSongSchema.parse(input), updatedBy);
  }

  async createPublishedSong(
    input: unknown,
    sourceIngestionId: string,
    updatedBy?: string,
  ): Promise<SongEntity> {
    return this.songs.createPublished(CreateSongSchema.parse(input), sourceIngestionId, updatedBy);
  }

  async getPublishedByIngestion(sourceIngestionId: string): Promise<SongEntity | null> {
    return this.songs.findBySourceIngestionId(sourceIngestionId);
  }

  async getNextMmid(): Promise<number> {
    return this.songs.nextMmid();
  }

  async getSongForEdit(id: unknown): Promise<SongEditRecord> {
    const song = await this.songs.findForEdit(SongIdSchema.parse(id));
    if (!song) throw new NotFoundError("Song not found", "SONG_NOT_FOUND");
    return song;
  }

  async updateSong(id: unknown, revision: unknown, input: unknown, updatedBy?: string): Promise<SongEntity> {
    const mmid = SongIdSchema.parse(id);
    const expectedRevision = SongRevisionSchema.parse(revision);
    const content = SongContentSchema.parse(input);
    const song = await this.songs.update(mmid, expectedRevision, content, updatedBy);
    if (song) return song;
    if (!(await this.songs.findByMmid(mmid))) throw new NotFoundError("Song not found", "SONG_NOT_FOUND");
    throw new SongConflictError();
  }

  async getAdminList(input: unknown = {}): Promise<AdminPage<AdminSongRecord>> {
    const query = AdminListQuerySchema.parse(input);
    return this.songs.listAdmin(query);
  }

  async getAdminCount(): Promise<number> {
    return this.songs.countAdmin();
  }

  async getByMmid(mmid: number): Promise<SongEntity> {
    const song = await this.songs.findByMmid(mmid);
    if (!song) {
      throw new NotFoundError(`Song with mmid ${mmid} was not found`, "SONG_NOT_FOUND");
    }
    return song;
  }

  async getSongPage(mmid: number): Promise<SongEntity> {
    return withCanonicalLyrics(await this.getByMmid(mmid));
  }

  async search(query: string): Promise<SongSearchResult[]> {
    return this.songs.searchByTitle(query);
  }

  async getRandomSong(): Promise<RandomSongResult | null> {
    return this.songs.findRandom();
  }

  async getLatestSongs(limit: number = 5): Promise<SongSummary[]> {
    return this.songs.findLatest(limit);
  }

  async getSongsByMmids(mmids: number[]): Promise<SongEntity[]> {
    return this.songs.findByMmids(mmids);
  }

  async getSitemapSongs(): Promise<SitemapSongRecord[]> {
    return this.songs.listForSitemap();
  }

  async getCatalogueSongs(): Promise<SongCatalogueRecord[]> {
    return this.songs.listCatalogue();
  }

  async getGuessLyricsSongs(): Promise<GuessLyricsSong[]> {
    return this.songs.listGuessLyricsSongs();
  }

  async getGuessSongRecords(): Promise<GuessSongRecord[]> {
    return this.songs.listGuessSongRecords();
  }

  async getSongsByArtistName(artistName: string): Promise<SongEntity[]> {
    return this.songs.findByArtistName(artistName);
  }

  async analyzeLyricsMigration(): Promise<LyricsMigrationReport> {
    return buildLyricsMigrationReport(await this.songs.listLyricsMigrationCandidates());
  }

  async analyzeLyricsMigrationRepairs(): Promise<LyricsMigrationRepairReport> {
    return buildLyricsMigrationRepairReport(await this.songs.listLyricsMigrationCandidates());
  }

  async migrateLowRiskLyricsV2(updatedBy: string): Promise<LyricsMigrationExecutionResult> {
    const candidates = await this.songs.listLyricsMigrationCandidates();
    const result: LyricsMigrationExecutionResult = {
      eligible: 0,
      migrated: 0,
      alreadyV2: 0,
      skippedConcurrent: 0,
    };

    for (const candidate of candidates) {
      const plan = planLyricsMigrationRepair(candidate);
      if (plan.strategy !== "READY" && plan.strategy !== "DETERMINISTIC_REPAIR") continue;
      if (!plan.preview) continue;

      result.eligible += 1;
      if (candidate.lyricsV2) {
        result.alreadyV2 += 1;
        continue;
      }

      const lyricsV2 = parseLyricsV2(plan.preview);
      const migrated = await this.songs.setLyricsV2IfAbsent(candidate.mmid, lyricsV2, updatedBy);
      if (migrated) result.migrated += 1;
      else result.skippedConcurrent += 1;
    }

    return result;
  }
}
