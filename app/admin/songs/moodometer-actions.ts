"use server";

import { requireAdmin } from "@/infrastructure/auth";
import { generateSongMoodPreview, SongIdSchema } from "@/modules/songs";

/** Preview only. Persistence and editorial publication arrive in later phases. */
export async function analyzeSongMoodAction(songId: number) {
  await requireAdmin();
  return generateSongMoodPreview(SongIdSchema.parse(songId));
}
