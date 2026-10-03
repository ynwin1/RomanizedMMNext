export type SongRequestStatus = "pending" | "added";

export interface SongRequestEntity {
  id: string;
  songName: string;
  artist: string;
  youtubeLink?: string;
  details?: string;
  notifyEmail?: string;
  requestedBy?: string;
  songStory?: string;
  createdAt?: Date;
  status?: SongRequestStatus;
}

export type CreateSongRequestInput = Omit<SongRequestEntity, "id" | "createdAt" | "status"> & {
  status?: SongRequestStatus;
};
