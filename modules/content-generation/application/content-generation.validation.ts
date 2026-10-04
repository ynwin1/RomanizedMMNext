import { z } from "zod";

export const LyricSourceLineSchema = z.object({
  index: z.number().int().min(0).max(100000),
  text: z.string().max(10000),
}).strict();

const lyricLines = z.array(LyricSourceLineSchema).min(1).max(5000);

function requireContinuousIndexes(
  lines: Array<{ index: number }>,
  context: z.RefinementCtx,
) {
  lines.forEach((line, position) => {
    if (line.index !== position) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines", position, "index"],
        message: "Lyric line indexes must be continuous and zero-based.",
      });
    }
  });
}

export const LyricGenerationInputSchema = z.object({
  lines: lyricLines,
}).strict().superRefine((value, context) => {
  requireContinuousIndexes(value.lines, context);
});

export const EditorialGenerationInputSchema = z.object({
  lines: lyricLines,
  songName: z.string().trim().min(1).max(500).optional(),
  artistNames: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
}).strict().superRefine((value, context) => {
  requireContinuousIndexes(value.lines, context);
});

export const GeneratedLyricLineSchema = z.object({
  index: z.number().int().min(0).max(100000),
  text: z.string().max(10000),
}).strict();

export const LineGenerationResultSchema = z.object({
  lines: z.array(GeneratedLyricLineSchema).max(5000),
}).strict();

export const EditorialGenerationResultSchema = z.object({
  about: z.string().trim().min(1).max(10000),
  whenToListen: z.string().trim().min(1).max(10000),
}).strict();
