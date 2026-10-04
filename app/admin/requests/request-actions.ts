"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { logger } from "@/infrastructure/logging/logger";
import { ingestionWorkflowService } from "@/modules/ingestions";
import { songRequestService } from "@/modules/requests";
import { createRequestActionHandler, type RequestActionState } from "./request-action-handler";

const actions = createRequestActionHandler({
  authorize: requireAdmin,
  requests: songRequestService,
  acceptRequest: (id, revision, updatedBy) =>
    ingestionWorkflowService.acceptRequest(id, revision, updatedBy),
  saved(id) {
    revalidatePath("/admin", "layout");
    redirect("/admin/requests/" + id + "?saved=1");
  },
  accepted(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId);
  },
  rejected() {
    revalidatePath("/admin", "layout");
    redirect("/admin/requests");
  },
  logFailure(error) {
    logger.error("Admin request review failed", error);
  },
});

export async function decideRequestAction(
  id: string,
  revision: number,
  previous: RequestActionState,
  form: FormData,
) {
  return actions.decide(id, revision, previous, form);
}

export async function updateRequestStatusAction(
  id: string,
  revision: number,
  previous: RequestActionState,
  form: FormData,
) {
  return actions.update(id, revision, previous, form);
}
