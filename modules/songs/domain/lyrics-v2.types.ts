export interface LyricsV2Line {
  kind: "line";
  /**
   * Canonical source lyric text. The field keeps the existing RomanizedMM
   * "burmese" terminology, but mixed-language source lines are allowed.
   */
  burmese: string;
  romanized: string;
  /**
   * Null means the English meaning is intentionally omitted/not applicable.
   * Empty strings are not canonical.
   */
  meaning: string | null;
}

export interface LyricsV2Break {
  kind: "break";
}

export type LyricsV2Entry = LyricsV2Line | LyricsV2Break;

export interface LyricsV2 {
  version: 2;
  entries: LyricsV2Entry[];
}
