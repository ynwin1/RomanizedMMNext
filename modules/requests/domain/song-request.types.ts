export type SongRequestStatus = "pending" | "reviewing" | "accepted" | "rejected" | "completed";
export type StoredSongRequestStatus = SongRequestStatus | "added";

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
  updatedAt?: Date;
  updatedBy?: string;
  status?: StoredSongRequestStatus;
}

export type CreateSongRequestInput = Omit<
  SongRequestEntity,
  "id" | "createdAt" | "updatedAt" | "updatedBy" | "status"
>;
