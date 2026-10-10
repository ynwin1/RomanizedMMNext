import type { LyricsMigrationAssessment, LyricsMigrationStatus } from "@/modules/songs/domain/lyrics-migration.types";

export type LyricsHealthFilter = LyricsMigrationStatus | "ALL" | "ISSUES";

export function parseLyricsHealthFilter(value: unknown): LyricsHealthFilter {
  const filter = typeof value === "string" ? value.toUpperCase() : "ISSUES";
  return ["ALL", "ISSUES", "SAFE", "WARNING", "MANUAL_REVIEW", "INVALID"].includes(filter)
    ? filter as LyricsHealthFilter
    : "ISSUES";
}

export function filterLyricsHealth(
  assessments: LyricsMigrationAssessment[],
  filter: LyricsHealthFilter,
  query: string,
): LyricsMigrationAssessment[] {
  const needle = query.trim().toLocaleLowerCase().slice(0, 100);
  return assessments.filter(assessment => {
    if (filter === "ISSUES" && assessment.status === "SAFE") return false;
    if (filter !== "ISSUES" && filter !== "ALL" && assessment.status !== filter) return false;
    return !needle
      || assessment.songName.toLocaleLowerCase().includes(needle)
      || String(assessment.mmid).includes(needle);
  });
}
