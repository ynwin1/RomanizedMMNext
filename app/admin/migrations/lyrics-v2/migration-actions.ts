"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { logger } from "@/infrastructure/logging/logger";
import { songService } from "@/modules/songs";

const CONFIRMATION = "MIGRATE_LOW_RISK";

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
