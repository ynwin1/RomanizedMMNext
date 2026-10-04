import type { CreateSongInput, SongContentInput } from "./song.validation";
import type { SongEditRecord } from "./song.dto";
import type { AdminListQuery } from "@/shared/admin-list";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRecord } from "./song.dto";
import type { SongEntity } from "../domain/song.types";
import type { LyricsV2 } from "../domain/lyrics-v2.types";
import type { LegacyLyricsMigrationCandidate } from "../domain/lyrics-migration.types";
import type { LegacyLyricsSnapshot, LyricsMeaningAlignmentSaveResult } from "../domain/lyrics-meaning-alignment.types";
import type {
  GuessLyricsSong,
  GuessSongRecord,
  RandomSongResult,
  SitemapSongRecord,
  SongCatalogueRecord,
  SongSearchResult,
  SongSummary,
} from "./song.dto";

export interface ISongRepository {
  create(input: CreateSongInput, updatedBy?: string): Promise<SongEntity>;
  createPublished(input: CreateSongInput, sourceIngestionId: string, updatedBy?: string): Promise<SongEntity>;
  findBySourceIngestionId(sourceIngestionId: string): Promise<SongEntity | null>;
  nextMmid(): Promise<number>;
  findForEdit(mmid: number): Promise<SongEditRecord | null>;
  update(mmid: number, revision: number, input: SongContentInput, updatedBy?: string): Promise<SongEntity | null>;
  listAdmin(query: AdminListQuery): Promise<AdminPage<AdminSongRecord>>;
  countAdmin(): Promise<number>;
  findByMmid(mmid: number): Promise<SongEntity | null>;
  searchByTitle(query: string): Promise<SongSearchResult[]>;
  findRandom(): Promise<RandomSongResult | null>;
  findLatest(limit: number): Promise<SongSummary[]>;
  findByMmids(mmids: number[]): Promise<SongEntity[]>;
  listForSitemap(): Promise<SitemapSongRecord[]>;
  listCatalogue(): Promise<SongCatalogueRecord[]>;
  listGuessLyricsSongs(): Promise<GuessLyricsSong[]>;
  listGuessSongRecords(): Promise<GuessSongRecord[]>;
  findByArtistName(artistName: string): Promise<SongEntity[]>;
  listLyricsMigrationCandidates(): Promise<LegacyLyricsMigrationCandidate[]>;
  setLyricsV2IfAbsent(mmid: number, lyricsV2: LyricsV2, updatedBy: string): Promise<boolean>;
  setLyricsV2IfLegacyMatches(mmid: number, expected: LegacyLyricsSnapshot, lyricsV2: LyricsV2, updatedBy: string): Promise<LyricsMeaningAlignmentSaveResult>;
}
