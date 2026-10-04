import type { LyricsV2, LyricsV2Entry } from "../domain/lyrics-v2.types";
import type {
  LegacyLyricsMigrationCandidate,
  LyricsMigrationRepairPlan,
  LyricsMigrationRepairReport,
  LyricsMigrationRepairStrategy,
} from "../domain/lyrics-migration.types";
import { assessLyricsMigration } from "./lyrics-migration.validator";

function split(value: string): string[] {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function nonblank(value: string): boolean {
  return value.trim().length > 0;
}

function values(lines: string[]): string[] {
  return lines.filter(nonblank).map(line => line.trim());
}

function previewFromSequences(
  sourceLines: string[],
  romanizedLines: string[],
  meaningLines: string[],
): LyricsV2 {
  const romanized = values(romanizedLines);
  const meaning = values(meaningLines);
  const entries: LyricsV2Entry[] = [];
  let lyricIndex = 0;

  for (const source of sourceLines) {
    if (!nonblank(source)) {
      if (entries.length && entries[entries.length - 1].kind !== "break") entries.push({ kind: "break" });
      continue;
    }

    entries.push({
      kind: "line",
      burmese: source.trim(),
      romanized: romanized[lyricIndex],
      meaning: meaning[lyricIndex] ?? null,
    });
    lyricIndex += 1;
  }

  if (entries[entries.length - 1]?.kind === "break") entries.pop();
  return { version: 2, entries };
}

export function planLyricsMigrationRepair(
  candidate: LegacyLyricsMigrationCandidate,
): LyricsMigrationRepairPlan {
  const assessment = assessLyricsMigration(candidate);
  const sourceLines = split(candidate.burmese);
  const romanizedLines = split(candidate.romanized);
  const meaningLines = split(candidate.meaning);

  const source = values(sourceLines);
  const romanized = values(romanizedLines);
  const meaning = values(meaningLines);

  const base = {
    mmid: candidate.mmid,
    songName: candidate.songName,
    sourceLyricLines: source.length,
    romanizedLines: romanized.length,
    meaningLines: meaning.length,
  };

  if (candidate.lyricsV2 || assessment.status === "SAFE" || assessment.status === "WARNING") {
    return {
      ...base,
      strategy: "READY",
      reason: candidate.lyricsV2
        ? "Song already has lyricsV2."
        : "Existing legacy fields already produce a valid V2 preview.",
      preview: assessment.preview,
    };
  }

  if (!source.length || !romanized.length) {
    return {
      ...base,
      strategy: "MANUAL_REVIEW",
      reason: "The source or Romanized lyric backbone is empty.",
    };
  }

  if (source.length !== romanized.length) {
    return {
      ...base,
      strategy: "AI_ROMANIZATION_REPAIR",
      reason: `Burmese/source has ${source.length} lyric rows while Romanized has ${romanized.length}; existing Romanization must be preserved where matchable and repaired only where missing or merged.`,
    };
  }

  if (source.length === meaning.length) {
    return {
      ...base,
      strategy: "DETERMINISTIC_REPAIR",
      reason: "Burmese, Romanized, and Meaning contain the same number of nonblank lyric rows; blank-line drift can be repaired by ordered alignment without rewriting text.",
      preview: previewFromSequences(sourceLines, romanizedLines, meaningLines),
    };
  }

  return {
    ...base,
    strategy: "AI_MEANING_ALIGNMENT",
    reason: `Burmese and Romanized already form a ${source.length}-row backbone, but Meaning has ${meaning.length} nonblank rows. Preserve both anchors and use AI only to align or fill Meaning.`,
  };
}

export function buildLyricsMigrationRepairReport(
  candidates: LegacyLyricsMigrationCandidate[],
): LyricsMigrationRepairReport {
  const plans = candidates.map(planLyricsMigrationRepair);
  const counts: Record<LyricsMigrationRepairStrategy, number> = {
    READY: 0,
    DETERMINISTIC_REPAIR: 0,
    AI_MEANING_ALIGNMENT: 0,
    AI_ROMANIZATION_REPAIR: 0,
    MANUAL_REVIEW: 0,
  };
  for (const plan of plans) counts[plan.strategy] += 1;
  return { total: plans.length, counts, plans };
}
