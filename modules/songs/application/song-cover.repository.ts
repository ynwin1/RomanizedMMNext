import type { SongCoverVideo, SongCoverStatus } from "../domain/song-cover.types";

export interface StoredSongCover extends SongCoverVideo {
  id: string;
}

export interface CoverReviewQuery {status: SongCoverStatus; page: number; limit: number; mmids?: number[]}
export interface CoverReviewPage {items: StoredSongCover[]; total: number; page: number; limit: number; totalPages: number}
export interface SongCoverRepository {
  listCommunity(query: CoverReviewQuery): Promise<CoverReviewPage>;
  list(mmid: number, status?: SongCoverStatus): Promise<StoredSongCover[]>;
  get(mmid: number, id: string): Promise<StoredSongCover | null>;
  insert(input: SongCoverVideo): Promise<StoredSongCover>;
  edit(mmid: number, id: string, changes: Record<string, unknown>, expectedStatus?: SongCoverStatus): Promise<StoredSongCover | null>;
  remove(mmid: number, id: string): Promise<boolean>;
  reorder(mmid: number, ids: string[]): Promise<void>;
}
