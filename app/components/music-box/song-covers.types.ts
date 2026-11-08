/** Public data only: no moderation, reviewer or contributor internals. */
export interface PublicSongCover {
  id: string;
  youtubeVideoId: string;
  title?: string;
  description?: string;
}

/** A card's dimensions determine navigation, not a hardcoded number of pixels. */
export function nextCoverScrollPosition(
  current: number,
  direction: -1 | 1,
  step: number,
  maximum: number,
): number {
  if (!Number.isFinite(current) || !Number.isFinite(step) || !Number.isFinite(maximum) ||
      step <= 0 || maximum <= 0) return 0;
  return Math.min(Math.max(0, current + direction * step), maximum);
}
