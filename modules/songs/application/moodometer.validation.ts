import { z } from "zod";
import { MOOD_IDS } from "../domain/moodometer.types";

const MoodScoreSchema = z.object({
  moodId: z.enum(MOOD_IDS),
  score: z.number().finite().min(0).max(10).refine(
    score => Number.isInteger(Math.round(score * 100) / 10 * 10) && Math.abs(score * 10 - Math.round(score * 10)) < 1e-8,
    "Scores must use at most one decimal place"
  ),
}).strict();

export const MoodometerAnalysisSchema = z.object({
  version: z.literal(1),
  source: z.literal("lyrics"),
  status: z.enum(["draft", "published"]),
  lyricsFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  moods: z.array(MoodScoreSchema).length(3),
  summary: z.string().trim().min(1).max(500),
  modelVersion: z.string().trim().min(1).max(100),
}).strict().superRefine((analysis, ctx) => {
  const seen = new Set<string>();
  for (const [index, mood] of analysis.moods.entries()) {
    if (seen.has(mood.moodId)) {
      ctx.addIssue({code:z.ZodIssueCode.custom,path:["moods",index,"moodId"],message:"Duplicate mood"});
    }
    seen.add(mood.moodId);
    if (index > 0 && mood.score > analysis.moods[index - 1].score) {
      ctx.addIssue({code:z.ZodIssueCode.custom,path:["moods",index,"score"],message:"Order moods by descending score"});
    }
  }
});
