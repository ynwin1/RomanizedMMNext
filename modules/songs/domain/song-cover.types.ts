/**
 * A community or admin-curated YouTube interpretation of a song.
 * References Song.mmid, not the Song MongoDB _id.
 */
export const SONG_COVER_STATUSES = ["pending", "approved", "rejected"] as const;
export const SONG_COVER_SOURCES = ["admin", "community"] as const;

export type SongCoverStatus = (typeof SONG_COVER_STATUSES)[number];
export type SongCoverSource = (typeof SONG_COVER_SOURCES)[number];

export interface SongCoverVideo {
  mmid: number;
  youtubeVideoId: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  contributorName?: string;
  status: SongCoverStatus;
  source: SongCoverSource;
  sortOrder: number;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
