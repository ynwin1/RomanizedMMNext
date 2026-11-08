import type { StoredSongCover } from "./song-cover.repository";

/**
 * Exactly the fields safe to publish. Never expose contributor names,
 * moderation statuses or the Clerk ID of the reviewer in public endpoints.
 */
export interface PublicCoverRecord {
  id: string;
  youtubeVideoId: string;
  title?: string;
  description?: string;
}

export function publicCoverRecords(covers: readonly StoredSongCover[]): PublicCoverRecord[] {
  return covers
    .filter(cover => cover.status === "approved")
    .map(cover => ({
      id: cover.id,
      youtubeVideoId: cover.youtubeVideoId,
      ...(cover.title ? {title: cover.title} : {}),
      ...(cover.description ? {description: cover.description} : {}),
    }));
}
