"use server";

import { requireAdmin } from "@/infrastructure/auth";
import { revalidatePath } from "next/cache";
import { lyricTimingService, loadRawLyricTimingTrack } from "@/modules/songs";

export async function getLyricTimingAction(mmid: number, videoId: string) {
  await requireAdmin();
  return lyricTimingService.load(mmid, videoId);
}

export async function saveLyricTimingAction(mmid: number, input: unknown) {
  await requireAdmin();
  const track = await lyricTimingService.save(mmid, input);
  revalidatePath("/[locale]/song/[name]/[id]", "page");
  return track;
}

/** Recovery is admin only; do not expose unverified timings publicly. */
export async function recoverStoredLyricTimingAction(mmid: number, videoId: string) {
  await requireAdmin();
  return loadRawLyricTimingTrack(mmid, videoId);
}
