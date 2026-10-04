import type { LyricsV2 } from "./lyrics-v2.types";
import type { LyricsMigrationRepairStrategy } from "./lyrics-migration.types";

export type MeaningAlignmentSource = "reused" | "generated";
export type MeaningAlignmentConfidence = "high" | "medium" | "low";

export interface MeaningAlignmentInputLine {
  index: number;
  burmese: string;
  romanized: string;
}

export interface MeaningAlignmentInput {
  songName: string;
  lines: MeaningAlignmentInputLine[];
  existingMeaningLines: string[];
}

export interface MeaningAlignmentOutputLine {
  index: number;
  meaning: string;
  source: MeaningAlignmentSource;
  confidence: MeaningAlignmentConfidence;
}

export interface MeaningAlignmentResult {
  lines: MeaningAlignmentOutputLine[];
}

export interface LegacyLyricsSnapshot {
  burmese: string;
  romanized: string;
  meaning: string;
}

export interface LyricsMeaningAlignmentSaveResult {
  status: "saved" | "stale" | "already_v2";
}

export interface LyricsMeaningAlignmentPreview {
  mmid: number;
  songName: string;
  strategy: LyricsMigrationRepairStrategy;
  legacySnapshot: LegacyLyricsSnapshot;
  lyricsV2: LyricsV2;
  rows: Array<MeaningAlignmentOutputLine & {
    burmese: string;
    romanized: string;
    edited: boolean;
  }>;
  cached: boolean;
  counts: {
    reused: number;
    generated: number;
    lowConfidence: number;
  };
}
