import type { SongCoverVideo, SongCoverStatus } from "../domain/song-cover.types";

export interface StoredSongCover extends SongCoverVideo {
  id: string;
}

export interface SongCoverRepository {
  list(mmid: number, status?: SongCoverStatus): Promise<StoredSongCover[]>;
  get(mmid: number, id: string): Promise<StoredSongCover | null>;
  insert(input: SongCoverVideo): Promise<StoredSongCover>;
  edit(mmid: number, id: string, changes: Record<string, unknown>, expectedStatus?: SongCoverStatus): Promise<StoredSongCover | null>;
  remove(mmid: number, id: string): Promise<boolean>;
  reorder(mmid: number, ids: string[]): Promise<void>;
}
