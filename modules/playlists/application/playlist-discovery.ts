import {PLAYLIST_GENRES, type PlaylistEntity, type PlaylistGenre} from "../domain/playlist.types";
import {PlaylistGenreSchema} from "./playlist.validation";

export interface PlaylistGenreGroup {
  genre: PlaylistGenre;
  playlists: PlaylistEntity[];
}

/** Keep the all-genres overview short; offer up to five on a dedicated genre view. */
export async function loadPlaylistDiscovery(
  requestedGenre: unknown,
  listPublishedByGenre: (genre: PlaylistGenre, limit: number) => Promise<PlaylistEntity[]>,
): Promise<{selectedGenre: PlaylistGenre | null; groups: PlaylistGenreGroup[]}> {
  const parsed = PlaylistGenreSchema.safeParse(requestedGenre);
  const selectedGenre = parsed.success ? parsed.data : null;
  const genres = selectedGenre ? [selectedGenre] : [...PLAYLIST_GENRES];
  const limit = selectedGenre ? 5 : 3;
  const results = await Promise.all(genres.map(async genre => ({
    genre,
    playlists: (await listPublishedByGenre(genre, limit)).slice(0, limit),
  })));
  return {selectedGenre, groups: results.filter(group => group.playlists.length > 0)};
}
