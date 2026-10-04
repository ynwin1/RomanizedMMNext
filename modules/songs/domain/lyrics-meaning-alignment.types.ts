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

export interface LyricsMeaningAlignmentPreview {
  mmid: number;
  songName: string;
  strategy: LyricsMigrationRepairStrategy;
  lyricsV2: LyricsV2;
  rows: Array<MeaningAlignmentOutputLine & {
    burmese: string;
    romanized: string;
  }>;
  counts: {
    reused: number;
    generated: number;
    lowConfidence: number;
  };
}
