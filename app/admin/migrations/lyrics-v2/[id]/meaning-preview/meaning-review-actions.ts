"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { logger } from "@/infrastructure/logging/logger";
import { lyricsMeaningReviewDraftRepository, songService } from "@/modules/songs";
import { LyricsMeaningAlignmentService } from "@/modules/songs/application/lyrics-meaning-alignment.service";
import type { LegacyLyricsSnapshot, LyricsMeaningAlignmentSaveResult } from "@/modules/songs/domain/lyrics-meaning-alignment.types";
import { createOpenAILyricsMeaningAlignmentAdapter } from "@/integrations/ai/openai-lyrics-meaning-alignment.adapter";

function previewPath(mmid: number, query = "") {
  return "/admin/migrations/lyrics-v2/" + mmid + "/meaning-preview" + query;
}

export async function saveMeaningAlignmentReviewAction(
  mmid: number,
  expected: LegacyLyricsSnapshot,
  form: FormData,
) {
  const principal = await requireAdmin();
  const meanings = form.getAll("meaning").map(value => String(value));
  const intent = String(form.get("intent") ?? "approve");

  let result: LyricsMeaningAlignmentSaveResult;
  try {
    const service = new LyricsMeaningAlignmentService(
      songService,
      lyricsMeaningReviewDraftRepository,
    );
    result = intent === "draft"
      ? await service.saveDraft(mmid, expected, meanings, principal.userId)
      : await service.saveReviewed(mmid, expected, meanings, principal.userId);
  } catch (error) {
    logger.error("Saving AI Meaning Alignment review failed", error, { mmid, intent });
    redirect(previewPath(mmid, "?saveError=failed"));
  }

  if (result.status === "stale") redirect(previewPath(mmid, "?saveError=stale"));
  if (result.status === "already_v2") redirect("/admin/migrations/lyrics-v2?saveResult=already-v2");

  if (intent === "draft") {
    revalidatePath(previewPath(mmid));
    redirect(previewPath(mmid, "?draftSaved=1"));
  }

  revalidatePath("/admin/migrations/lyrics-v2");
  revalidatePath("/admin", "layout");
  revalidatePath("/en", "layout");
  redirect("/admin/migrations/lyrics-v2?saveResult=meaning-reviewed&mmid=" + mmid);
}

export async function regenerateMeaningAlignmentAction(mmid: number) {
  const principal = await requireAdmin();

  try {
    const service = new LyricsMeaningAlignmentService(
      songService,
      lyricsMeaningReviewDraftRepository,
      createOpenAILyricsMeaningAlignmentAdapter(),
    );
    await service.preview(mmid, { regenerate: true, updatedBy: principal.userId });
  } catch (error) {
    logger.error("Regenerating AI Meaning Alignment preview failed", error, { mmid });
    redirect(previewPath(mmid, "?saveError=regenerate"));
  }

  revalidatePath(previewPath(mmid));
  redirect(previewPath(mmid, "?regenerated=1"));
}
