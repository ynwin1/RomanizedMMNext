import { z } from "zod";
import type { LyricsV2 } from "../domain/lyrics-v2.types";

const lyricText = z.string().trim().min(1).max(2000);

export const LyricsV2LineSchema = z.object({
  kind: z.literal("line"),
  burmese: lyricText,
  romanized: lyricText,
  meaning: z.union([lyricText, z.null()]),
}).strict();

export const LyricsV2BreakSchema = z.object({
  kind: z.literal("break"),
}).strict();

const LyricsV2EntrySchema = z.discriminatedUnion("kind", [
  LyricsV2LineSchema,
  LyricsV2BreakSchema,
]);

export const LyricsV2Schema = z.object({
  version: z.literal(2),
  entries: z.array(LyricsV2EntrySchema).min(1).max(5000),
}).strict().superRefine((value, ctx) => {
  const entries = value.entries;
  if (!entries.some(entry => entry.kind === "line")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["entries"],
      message: "Lyrics must contain at least one lyric line",
    });
  }

  entries.forEach((entry, index) => {
    if (entry.kind !== "break") return;

    if (index === 0 || index === entries.length - 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entries", index],
        message: "Lyrics cannot start or end with a break",
      });
    }

    if (index > 0 && entries[index - 1]?.kind === "break") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entries", index],
        message: "Consecutive lyric breaks are not canonical",
      });
    }
  });
});

export function parseLyricsV2(input: unknown): LyricsV2 {
  return LyricsV2Schema.parse(input);
}
