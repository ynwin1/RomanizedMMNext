import type { LyricsV2 } from "./lyrics-v2.types";

export type LyricsMigrationStatus = "SAFE" | "WARNING" | "INVALID" | "MANUAL_REVIEW";

export interface LegacyLyricsMigrationCandidate {
  mmid: number;
  songName: string;
  burmese: string;
  romanized: string;
  meaning: string;
  lyricsV2?: LyricsV2;
}

export interface LyricsMigrationDiagnostic {
  code:
    | "ALREADY_V2"
    | "EMPTY_BURMESE"
    | "EMPTY_ROMANIZED"
    | "LINE_COUNT_MISMATCH"
    | "BREAK_STRUCTURE_MISMATCH"
    | "MISSING_ROMANIZATION"
    | "MISSING_MEANING";
  message: string;
  line?: number;
}

export interface LyricsMigrationAssessment {
  mmid: number;
  songName: string;
  status: LyricsMigrationStatus;
  diagnostics: LyricsMigrationDiagnostic[];
  preview?: LyricsV2;
}

export interface LyricsMigrationReport {
  total: number;
  counts: Record<LyricsMigrationStatus, number>;
  assessments: LyricsMigrationAssessment[];
}
