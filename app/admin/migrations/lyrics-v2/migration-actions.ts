"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { logger } from "@/infrastructure/logging/logger";
import { lyricsMeaningReviewDraftRepository, songService } from "@/modules/songs";
import { LyricsMeaningAlignmentService } from "@/modules/songs/application/lyrics-meaning-alignment.service";
import { createOpenAILyricsMeaningAlignmentAdapter } from "@/integrations/ai/openai-lyrics-meaning-alignment.adapter";

const CONFIRMATION = "MIGRATE_LOW_RISK";
const AI_DRAFT_CONFIRMATION = "GENERATE_AND_ACCEPT_10_AI_MEANING";

export async function migrateLowRiskLyricsV2Action(form: FormData) {
  const principal = await requireAdmin();

  if (form.get("confirmation") !== CONFIRMATION) {
    redirect("/admin/migrations/lyrics-v2?migrationError=confirmation");
  }

  let result;
  try {
    result = await songService.migrateLowRiskLyricsV2(principal.userId);
  } catch (error) {
    logger.error("Lyrics V2 low-risk migration failed", error);
    redirect("/admin/migrations/lyrics-v2?migrationError=failed");
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/en", "layout");
  redirect(
    "/admin/migrations/lyrics-v2?migrated=" + result.migrated
      + "&alreadyV2=" + result.alreadyV2
      + "&skippedConcurrent=" + result.skippedConcurrent,
  );
}


export async function generateAiMeaningDraftBatchAction(form: FormData) {
  const principal = await requireAdmin();

  if (form.get("confirmation") !== AI_DRAFT_CONFIRMATION) {
    redirect("/admin/migrations/lyrics-v2?aiBatchError=confirmation");
  }

  let result;
  try {
    const repairs = await songService.analyzeLyricsMigrationRepairs();
    const draftMmids = new Set(await lyricsMeaningReviewDraftRepository.listMmids());
    const meaningPlans = repairs.plans.filter(plan => plan.strategy === "AI_MEANING_ALIGNMENT");
    const candidates = [
      ...meaningPlans.filter(plan => draftMmids.has(plan.mmid)),
      ...meaningPlans.filter(plan => !draftMmids.has(plan.mmid)),
    ].map(plan => plan.mmid);

    const service = new LyricsMeaningAlignmentService(
      songService,
      lyricsMeaningReviewDraftRepository,
      createOpenAILyricsMeaningAlignmentAdapter(),
    );
    result = await service.generateAndAcceptBatch(candidates, principal.userId, 10);
  } catch (error) {
    logger.error("AI Meaning generate-and-accept batch failed", error);
    redirect("/admin/migrations/lyrics-v2?aiBatchError=failed");
  }

  revalidatePath("/admin/migrations/lyrics-v2");
  revalidatePath("/admin", "layout");
  revalidatePath("/en", "layout");
  redirect(
    "/admin/migrations/lyrics-v2?aiBatchSaved=" + result.saved
      + "&aiBatchGenerated=" + result.generated
      + "&aiBatchReusedDraft=" + result.reusedDraft
      + "&aiBatchAlreadyV2=" + result.alreadyV2
      + "&aiBatchStale=" + result.stale
      + "&aiBatchFailed=" + result.failed,
  );
}
