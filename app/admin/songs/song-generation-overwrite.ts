import type { LyricsV2Entry } from "@/modules/songs/domain/lyrics-v2.types";

/** Generated or manually authored V2 rows must never be overwritten on the first click. */
export function requiresGenerationOverwriteConfirmation(entries: LyricsV2Entry[]): boolean {
  return entries.length > 0;
}
