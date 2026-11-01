/** Timings belong to a specific recording, not to a locale or translated text. */
export interface LyricTimingLine {
  /** Zero-based index in LyricsV2.entries; breaks must not receive timestamps. */
  entryIndex: number;
  startMs: number;
  endMs: number;
}

export interface LyricTimingTrack {
  version: 1;
  /** The 11-character video ID identifies the exact YouTube recording. */
  youtubeVideoId: string;
  /** SHA-256 of the canonical LyricsV2 document at timing creation. */
  lyricsFingerprint: string;
  status: "draft" | "published";
  lines: LyricTimingLine[];
}
