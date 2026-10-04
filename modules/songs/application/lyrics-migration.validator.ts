import type { LyricsV2, LyricsV2Entry } from "../domain/lyrics-v2.types";
import type {
  LegacyLyricsMigrationCandidate,
  LyricsMigrationAssessment,
  LyricsMigrationDiagnostic,
  LyricsMigrationReport,
  LyricsMigrationStatus,
} from "../domain/lyrics-migration.types";

function splitLines(value: string): string[] {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function blank(value: string): boolean {
  return value.trim().length === 0;
}

export function assessLyricsMigration(candidate: LegacyLyricsMigrationCandidate): LyricsMigrationAssessment {
  if (candidate.lyricsV2) {
    return {
      mmid: candidate.mmid,
      songName: candidate.songName,
      status: "SAFE",
      diagnostics: [{
        code: "ALREADY_V2",
        message: "Song already has lyricsV2 and does not require legacy migration.",
      }],
      preview: candidate.lyricsV2,
    };
  }

  const diagnostics: LyricsMigrationDiagnostic[] = [];
  if (blank(candidate.burmese)) {
    diagnostics.push({ code: "EMPTY_BURMESE", message: "Burmese/source lyrics are empty." });
  }
  if (blank(candidate.romanized)) {
    diagnostics.push({ code: "EMPTY_ROMANIZED", message: "Romanized lyrics are empty." });
  }

  if (diagnostics.length) {
    return {
      mmid: candidate.mmid,
      songName: candidate.songName,
      status: "INVALID",
      diagnostics,
    };
  }

  const burmese = splitLines(candidate.burmese);
  const romanized = splitLines(candidate.romanized);
  const meaning = splitLines(candidate.meaning);

  if (burmese.length !== romanized.length || burmese.length !== meaning.length) {
    diagnostics.push({
      code: "LINE_COUNT_MISMATCH",
      message: `Line counts differ (Burmese: ${burmese.length}, Romanized: ${romanized.length}, Meaning: ${meaning.length}).`,
    });
    return {
      mmid: candidate.mmid,
      songName: candidate.songName,
      status: "MANUAL_REVIEW",
      diagnostics,
    };
  }

  const entries: LyricsV2Entry[] = [];
  let hasMissingMeaning = false;

  for (let index = 0; index < burmese.length; index++) {
    const sourceBlank = blank(burmese[index]);
    const romanizedBlank = blank(romanized[index]);
    const meaningBlank = blank(meaning[index]);
    const line = index + 1;

    if (sourceBlank) {
      if (!romanizedBlank || !meaningBlank) {
        diagnostics.push({
          code: "BREAK_STRUCTURE_MISMATCH",
          line,
          message: `Line ${line} is blank in Burmese/source but not blank in every aligned column.`,
        });
      } else if (entries.length > 0 && entries[entries.length - 1].kind !== "break") {
        entries.push({ kind: "break" });
      }
      continue;
    }

    if (romanizedBlank) {
      diagnostics.push({
        code: "MISSING_ROMANIZATION",
        line,
        message: `Line ${line} has Burmese/source text but no Romanized text.`,
      });
      continue;
    }

    if (meaningBlank) {
      hasMissingMeaning = true;
      diagnostics.push({
        code: "MISSING_MEANING",
        line,
        message: `Line ${line} has no English meaning and would migrate as null.`,
      });
    }

    entries.push({
      kind: "line",
      burmese: burmese[index].trim(),
      romanized: romanized[index].trim(),
      meaning: meaningBlank ? null : meaning[index].trim(),
    });
  }

  if (entries[entries.length - 1]?.kind === "break") entries.pop();

  if (diagnostics.some(item =>
    item.code === "BREAK_STRUCTURE_MISMATCH" ||
    item.code === "MISSING_ROMANIZATION"
  )) {
    return {
      mmid: candidate.mmid,
      songName: candidate.songName,
      status: "MANUAL_REVIEW",
      diagnostics,
    };
  }

  if (!entries.some(entry => entry.kind === "line")) {
    return {
      mmid: candidate.mmid,
      songName: candidate.songName,
      status: "INVALID",
      diagnostics: [{
        code: "EMPTY_BURMESE",
        message: "No migratable lyric lines were found.",
      }],
    };
  }

  const preview: LyricsV2 = { version: 2, entries };
  return {
    mmid: candidate.mmid,
    songName: candidate.songName,
    status: hasMissingMeaning ? "WARNING" : "SAFE",
    diagnostics,
    preview,
  };
}

export function buildLyricsMigrationReport(
  candidates: LegacyLyricsMigrationCandidate[],
): LyricsMigrationReport {
  const assessments = candidates.map(assessLyricsMigration);
  const counts: Record<LyricsMigrationStatus, number> = {
    SAFE: 0,
    WARNING: 0,
    INVALID: 0,
    MANUAL_REVIEW: 0,
  };
  for (const assessment of assessments) counts[assessment.status] += 1;
  return { total: assessments.length, counts, assessments };
}
