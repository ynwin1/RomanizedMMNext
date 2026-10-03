"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { songRequestService } from "@/modules/requests";
import { logger } from "@/infrastructure/logging/logger";
import { createRequestActionHandler, type RequestActionState } from "./request-action-handler";

const actions = createRequestActionHandler({
  authorize: requireAdmin,
  requests: songRequestService,
  saved(id) {
    revalidatePath("/admin", "layout");
    redirect("/admin/requests/" + id + "?saved=1");
  },
  logFailure(error) { logger.error("Admin request status update failed", error); },
});

export async function updateRequestStatusAction(id: string, revision: number, previous: RequestActionState, form: FormData) {
  return actions.update(id, revision, previous, form);
}
