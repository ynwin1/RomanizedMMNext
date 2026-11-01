"use server";

import { requireAdmin } from "@/infrastructure/auth";
import { lyricTimingService } from "@/modules/songs";

export async function getLyricTimingAction(mmid: number, videoId: string) {
  await requireAdmin();
  return lyricTimingService.load(mmid, videoId);
}

export async function saveLyricTimingAction(mmid: number, input: unknown) {
  await requireAdmin();
  return lyricTimingService.save(mmid, input);
}
