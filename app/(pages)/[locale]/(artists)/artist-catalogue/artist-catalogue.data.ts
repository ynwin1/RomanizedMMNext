import { songService } from "@/modules/songs";

export async function loadArtistCatalogueSongs(
  artists: Array<{ songs: number[] }>,
) {
  const songMmids = Array.from(
    new Set(artists.flatMap((artist) => artist.songs ?? [])),
  );

  return songMmids.length > 0
    ? songService.getSongsByMmids(songMmids)
    : [];
}
