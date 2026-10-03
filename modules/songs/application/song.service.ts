import { NotFoundError } from "@/shared/errors/not-found.error";
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
import { ISongRepository } from "../infrastructure/song.repository";

export class SongService {
  constructor(private readonly songs: ISongRepository) {}

  async getByMmid(mmid: number): Promise<SongEntity> {
    const song = await this.songs.findByMmid(mmid);
    if (!song) {
      throw new NotFoundError(`Song with mmid ${mmid} was not found`, "SONG_NOT_FOUND");
    }
    return song;
  }

  async getSongPage(mmid: number): Promise<SongEntity> {
    return this.getByMmid(mmid);
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
}
