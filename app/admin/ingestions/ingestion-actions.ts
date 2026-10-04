"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { logger } from "@/infrastructure/logging/logger";
import { contentDraftService } from "@/modules/content-drafts";
import { ContentGenerationService } from "@/modules/content-generation";
import { ingestionService, ingestionWorkflowService, IngestionRomanizationService } from "@/modules/ingestions";
import { createOpenAIContentGenerationAdapter } from "@/integrations/ai/openai-content-generation.adapter";
import { createIngestionActionHandler, type IngestionActionState } from "./ingestion-action-handler";

async function generateRomanization(ingestionId: string, updatedBy: string) {
  const generation = new ContentGenerationService(createOpenAIContentGenerationAdapter());
  const workflow = new IngestionRomanizationService(ingestionService, contentDraftService, generation);
  return workflow.generate(ingestionId, updatedBy);
}

const actions = createIngestionActionHandler({
  authorize: requireAdmin,
  workflow: ingestionWorkflowService,
  generateRomanization,
  started(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId);
  },
  sourceSaved(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?sourceSaved=1");
  },
  romanized(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?romanized=1");
  },
  logFailure(error) { logger.error("Admin ingestion workflow failed", error); },
});

export async function startIngestionAction(requestId: string, previous: IngestionActionState, form: FormData) {
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

export async function generateRomanizationAction(
  ingestionId: string,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.generateRomanization(ingestionId, previous, form);
}
