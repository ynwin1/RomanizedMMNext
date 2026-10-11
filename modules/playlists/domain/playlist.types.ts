export const PLAYLIST_PLATFORMS = ["spotify", "youtube", "apple_music"] as const;
export type PlaylistPlatform = typeof PLAYLIST_PLATFORMS[number];

export const PLAYLIST_GENRES = [
  "pop", "rock", "hip-hop-rap", "rnb-soul", "indie-alternative",
  "traditional-classical", "jazz-blues", "electronic-edm",
] as const;
export type PlaylistGenre = typeof PLAYLIST_GENRES[number];

export const PLAYLIST_STATUSES = ["draft", "published", "archived"] as const;
export type PlaylistStatus = typeof PLAYLIST_STATUSES[number];

export interface PlaylistEntity {
  id: string;
  platform: PlaylistPlatform;
  platformPlaylistId: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  curator?: string;
  genres: PlaylistGenre[];
  status: PlaylistStatus;
  sortOrder: number;
  revision: number;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}
