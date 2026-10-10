import type { LyricsV2 } from "@/modules/songs/domain/lyrics-v2.types";

export interface RomanizationReferenceSong {
  mmid: number;
  lyricsV2: LyricsV2;
}

export interface RomanizationReference {
  mmid: number;
  burmese: string;
  romanized: string;
}

export interface RomanizationReferenceSource {
  recentReviewedSongs(limit: number): Promise<RomanizationReferenceSong[]>;
}
