import { z } from "zod";

export const LyricSourceLineSchema = z.object({
  index: z.number().int().min(0).max(100000),
  text: z.string().max(10000),
}).strict();

export const GeneratedLyricLineSchema = z.object({
  index: z.number().int().min(0).max(100000),
  text: z.string().max(10000),
}).strict();

export const RomanizationReferenceSchema = z.object({
  burmese: z.string().trim().min(1).max(10000),
  romanized: z.string().trim().min(1).max(10000),
  meaning: z.string().trim().min(1).max(10000).optional(),
  sourceSongMmid: z.number().int().min(1),
  sourceSongName: z.string().trim().min(1).max(500),
  match: z.enum(["exact", "phrase", "similar"]),
  score: z.number().finite().min(0),
}).strict();

const lyricLines = z.array(LyricSourceLineSchema).min(1).max(5000);
const generatedLines = z.array(GeneratedLyricLineSchema).min(1).max(5000);
const references = z.array(RomanizationReferenceSchema).max(100).optional();
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

export const RomanizationGenerationInputSchema = z.object({
  lines: lyricLines,
  references,
}).strict().superRefine((value, context) => {
  requireContinuousIndexes(value.lines, context, "lines");
});

export const RomanizationReviewInputSchema = z.object({
  lines: lyricLines,
  romanizedLines: generatedLines,
  meaningLines: generatedLines,
  references,
}).strict().superRefine((value, context) => {
  requireContinuousIndexes(value.lines, context, "lines");
  requireContinuousIndexes(value.romanizedLines, context, "romanizedLines");
  requireContinuousIndexes(value.meaningLines, context, "meaningLines");

  if (value.romanizedLines.length !== value.lines.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["romanizedLines"],
      message: "Romanization review must include one proposed line per source line.",
    });
  }
  if (value.meaningLines.length !== value.lines.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meaningLines"],
      message: "Romanization review must include one meaning line per source line.",
    });
  }
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
