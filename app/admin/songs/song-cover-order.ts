import type { StoredSongCover } from "@/modules/songs/application/song-cover.repository";

/** Move one video without modifying the existing array or metadata. */
export function moveCover<T extends Pick<StoredSongCover, "id">>(
  covers: readonly T[],
  id: string,
  direction: -1 | 1,
): T[] | readonly T[] {
  const from = covers.findIndex(cover => cover.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= covers.length) return covers;
  const next = [...covers];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function orderedCoverIds(covers: readonly Pick<StoredSongCover, "id">[]): string[] {
  return covers.map(cover => cover.id);
}
