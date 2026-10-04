import { z } from "zod";

export const LyricSourceLineSchema = z.object({
  index: z.number().int().min(0).max(100000),
  text: z.string().max(10000),
}).strict();

export const GeneratedLyricLineSchema = z.object({
  index: z.number().int().min(0).max(100000),
  text: z.string().max(10000),
}).strict();

const lyricLines = z.array(LyricSourceLineSchema).min(1).max(5000);
const generatedLines = z.array(GeneratedLyricLineSchema).min(1).max(5000);
const oneLineEditorial = z.string()
  .trim()
  .min(1)
  .max(10000)
  .refine(value => !/[\r\n]/.test(value), "Editorial text must be a single line.");

function requireContinuousIndexes(
  lines: Array<{ index: number }>,
  context: z.RefinementCtx,
  pathPrefix: string,
) {
  lines.forEach((line, position) => {
    if (line.index !== position) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [pathPrefix, position, "index"],
        message: "Lyric line indexes must be continuous and zero-based.",
      });
    }
  });
}

export const LyricGenerationInputSchema = z.object({
  lines: lyricLines,
}).strict().superRefine((value, context) => {
  requireContinuousIndexes(value.lines, context, "lines");
});

export const EditorialGenerationInputSchema = z.object({
  lines: lyricLines,
  songName: z.string().trim().min(1).max(500).optional(),
  artistNames: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
  romanizedLines: generatedLines.optional(),
  meaningLines: generatedLines.optional(),
}).strict().superRefine((value, context) => {
  requireContinuousIndexes(value.lines, context, "lines");
  if (value.romanizedLines) requireContinuousIndexes(value.romanizedLines, context, "romanizedLines");
  if (value.meaningLines) requireContinuousIndexes(value.meaningLines, context, "meaningLines");
});

export const LineGenerationResultSchema = z.object({
  lines: z.array(GeneratedLyricLineSchema).max(5000),
}).strict();

export const EditorialGenerationResultSchema = z.object({
  about: oneLineEditorial,
  whenToListen: oneLineEditorial,
}).strict();
