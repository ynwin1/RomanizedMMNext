import { createHash } from "node:crypto";
import type { LyricsV2 } from "../domain/lyrics-v2.types";
import { parseLyricsV2 } from "./lyrics-v2.validation";

/** Deterministic over the canonical fields and ordered lyric entries. */
export function lyricTimingFingerprint(input: unknown): string {
  const lyrics: LyricsV2 = parseLyricsV2(input);
  const entries = lyrics.entries.map(entry => entry.kind === "break"
    ? ["break"] : ["line", entry.burmese, entry.romanized, entry.meaning]);
  return createHash("sha256").update(JSON.stringify([lyrics.version, entries])).digest("hex");
}
