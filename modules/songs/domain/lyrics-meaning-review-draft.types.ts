import type {
  LegacyLyricsSnapshot,
  MeaningAlignmentConfidence,
  MeaningAlignmentSource,
} from "./lyrics-meaning-alignment.types";

export interface LyricsMeaningReviewDraftRow {
  index: number;
  burmese: string;
  romanized: string;
  meaning: string;
  source: MeaningAlignmentSource;
  confidence: MeaningAlignmentConfidence;
  edited: boolean;
}

export interface LyricsMeaningReviewDraft {
  mmid: number;
  songName: string;
  legacySnapshot: LegacyLyricsSnapshot;
  rows: LyricsMeaningReviewDraftRow[];
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}
