import type { SongRequestStatus } from "../domain/song-request.types";

export interface SongRequestQueueItem {
  songName: string;
  artist: string;
}

export interface AdminSongRequestRecord {
  id: string;
  songName: string;
  artist: string;
  status: SongRequestStatus;
  createdAt?: Date;
}

export interface AdminSongRequestDetail {
  id: string;
  songName: string;
  artist: string;
  youtubeLink?: string;
  details?: string;
  notifyEmail?: string;
  requestedBy?: string;
  songStory?: string;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
  status: SongRequestStatus;
  revision: number;
}
