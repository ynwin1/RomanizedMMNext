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
