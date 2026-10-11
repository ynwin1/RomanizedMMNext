import {PLAYLIST_GENRES, type PlaylistEntity, type PlaylistGenre} from "../domain/playlist.types";
import {PlaylistGenreSchema} from "./playlist.validation";

export interface PlaylistGenreGroup {
  genre: PlaylistGenre;
  playlists: PlaylistEntity[];
}

/** Load at most five published selections per genre, even on the all-genres page. */
export async function loadPlaylistDiscovery(
  requestedGenre: unknown,
  listPublishedByGenre: (genre: PlaylistGenre, limit: number) => Promise<PlaylistEntity[]>,
): Promise<{selectedGenre: PlaylistGenre | null; groups: PlaylistGenreGroup[]}> {
  const parsed = PlaylistGenreSchema.safeParse(requestedGenre);
  const selectedGenre = parsed.success ? parsed.data : null;
  const genres = selectedGenre ? [selectedGenre] : [...PLAYLIST_GENRES];
  const results = await Promise.all(genres.map(async genre => ({
    genre,
    playlists: (await listPublishedByGenre(genre, 5)).slice(0, 5),
  })));
  return {selectedGenre, groups: results.filter(group => group.playlists.length > 0)};
}
