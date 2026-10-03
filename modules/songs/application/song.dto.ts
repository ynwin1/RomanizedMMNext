import { SongArtist } from "../domain/song.types";

export interface SongSearchResult {
  songName: string;
  mmid: number;
  artistName: SongArtist[];
}

export interface RandomSongResult {
  songName: string;
  mmid: number;
}

export interface SitemapSongRecord {
  mmid: number;
  songName: string;
}

export interface SongSummary {
  mmid: number;
  songName: string;
  artistName: SongArtist[];
  imageLink?: string;
  createdAt?: Date;
}

export interface SongCatalogueRecord {
  mmid: number;
  songName: string;
  artistName: SongArtist[];
  imageLink?: string;
}

export interface GuessLyricsSong {
  songName: string;
  romanized: string;
  burmese: string;
}

export interface GuessSongRecord {
  songName: string;
  youtubeLink?: string[];
  mmid: number;
}
