export interface SongRequestQueueItem {
  songName: string;
  artist: string;
}

export interface AdminSongRequestRecord {
  id: string;
  songName: string;
  artist: string;
  status: "pending" | "added";
  createdAt?: Date;
}
