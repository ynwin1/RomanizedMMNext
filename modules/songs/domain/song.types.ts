import type { LyricsV2 } from "./lyrics-v2.types";

export interface SongArtist {
  name: string;
  slug?: string;
}

export interface SongEntity {
  id: string;
  mmid: number;
  songName: string;
  artistName: SongArtist[];
  albumName?: string;
  genre: string;
  spotifyTrackId?: string;
  spotifyLink?: string;
  appleMusicLink?: string;
  youtubeLink?: string[];
  imageLink?: string;
  about: string;
  whenToListen: string;
  lyrics: string;
  romanized: string;
  burmese: string;
  meaning: string;
  lyricsV2?: LyricsV2;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
  isRequested?: boolean;
  requestedBy?: string;
  songStoryEn?: string;
  songStoryMy?: string;
}
