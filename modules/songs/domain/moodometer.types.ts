export const MOOD_IDS = [
  "romantic", "nostalgic", "heartbroken", "celebratory", "peaceful",
  "energetic", "melancholic", "hopeful", "confident", "angry",
  "longing", "dreamy", "anxious", "comforting", "playful",
] as const;
export type MoodId = typeof MOOD_IDS[number];
export interface MoodScore { moodId: MoodId; score: number; }
export interface MoodometerAnalysis {
  version: 1;
  source: "lyrics";
  status: "draft" | "published";
  lyricsFingerprint: string;
  moods: MoodScore[];
  summary: string;
  modelVersion: string;
}
