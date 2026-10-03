import type { CreateSongInput, SongContentInput } from "./song.validation";
import type { SongEditRecord } from "./song.dto";
import { AdminListQuerySchema, type AdminListQuery } from "@/shared/admin-list";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRecord } from "./song.dto";
import { SongEntity } from "../domain/song.types";
import {
  GuessLyricsSong,
  GuessSongRecord,
  RandomSongResult,
  SitemapSongRecord,
  SongCatalogueRecord,
  SongSearchResult,
  SongSummary,
} from "./song.dto";

export interface ISongRepository {
  create(input: CreateSongInput): Promise<SongEntity>;
  findForEdit(mmid: number): Promise<SongEditRecord | null>;
  update(mmid: number, revision: number, input: SongContentInput): Promise<SongEntity | null>;
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
}
