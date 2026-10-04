"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { ingestionWorkflowService } from "@/modules/ingestions";
import { logger } from "@/infrastructure/logging/logger";
import { createIngestionActionHandler, type IngestionActionState } from "./ingestion-action-handler";

const actions = createIngestionActionHandler({
  authorize: requireAdmin,
  workflow: ingestionWorkflowService,
  started(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId);
  },
  sourceSaved(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?sourceSaved=1");
  },
  logFailure(error) { logger.error("Admin ingestion workflow failed", error); },
});

export async function startIngestionAction(
  requestId: string,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.start(requestId, previous, form);
}

export async function saveIngestionSourceAction(
  ingestionId: string,
  ingestionRevision: number,
  draftRevision: number,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.saveSource(ingestionId, ingestionRevision, draftRevision, previous, form);
}
