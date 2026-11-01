import { z } from "zod";
import type { LyricsV2 } from "../domain/lyrics-v2.types";
import type { LyricTimingTrack } from "../domain/lyric-timing.types";
import { LyricsV2Schema } from "./lyrics-v2.validation";

const timestamp = z.number().int().nonnegative().max(24 * 60 * 60 * 1000);
const lineSchema = z.object({
  entryIndex: z.number().int().nonnegative(),
  startMs: timestamp,
  endMs: timestamp,
}).strict().refine(line => line.endMs > line.startMs, {
  message: "The end of a lyric line must be after its start",
});

export const LyricTimingTrackSchema = z.object({
  version: z.literal(1),
  youtubeVideoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  lyricsFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(["draft", "published"]),
  lines: z.array(lineSchema).max(5000),
}).strict().superRefine((track, ctx) => {
  const seen = new Set<number>();
  let previousIndex = -1;
  let previousEnd = -1;
  track.lines.forEach((line, i) => {
    if (seen.has(line.entryIndex)) ctx.addIssue({code: "custom", path: ["lines", i, "entryIndex"], message: "Duplicate timed lyric entry"});
    seen.add(line.entryIndex);
    if (line.entryIndex <= previousIndex) ctx.addIssue({code: "custom", path: ["lines", i, "entryIndex"], message: "Timed entries must follow lyric order"});
    if (line.startMs < previousEnd) ctx.addIssue({code: "custom", path: ["lines", i, "startMs"], message: "Timing lines must be non-overlapping and ordered"});
    previousIndex = line.entryIndex;
    previousEnd = line.endMs;
  });
});

/** Validate track references; fingerprint verification is enforced on persistence in P17.2. */
export function parseLyricTimingTrack(input: unknown, lyricsInput: unknown): LyricTimingTrack {
  const lyrics: LyricsV2 = LyricsV2Schema.parse(lyricsInput);
  const track = LyricTimingTrackSchema.parse(input);
  const allowed = new Set(lyrics.entries.flatMap((entry, i) => entry.kind === "line" ? [i] : []));
  for (const line of track.lines) {
    if (!allowed.has(line.entryIndex)) throw new Error(`Timing entry ${line.entryIndex} does not reference a lyric line`);
  }
  if (track.status === "published" && track.lines.length !== allowed.size) {
    throw new Error("A published timing track must cover every lyric line");
  }
  return track;
}
