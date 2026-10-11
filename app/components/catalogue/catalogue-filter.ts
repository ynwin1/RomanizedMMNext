export type CatalogueSearchableSong = {
  songName: string;
  artistName: {name: string}[];
};

export const normalizeCatalogueQuery = (value: string) => value.trim().slice(0, 100);

export function filterCatalogueSongs<T extends CatalogueSearchableSong>(songs: T[], input: string): T[] {
  const query = normalizeCatalogueQuery(input).toLocaleLowerCase();
  if (!query) return songs;
  return songs.filter(song =>
    song.songName.toLocaleLowerCase().includes(query) ||
    song.artistName.some(artist => artist.name.toLocaleLowerCase().includes(query))
  );
}
