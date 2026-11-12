"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { logger } from "@/infrastructure/logging/logger";
import { songRequestService } from "@/modules/requests";
import { createRequestActionHandler, type RequestActionState } from "./request-action-handler";

const actions = createRequestActionHandler({
  authorize: requireAdmin,
  requests: songRequestService,
  saved(id) {
    revalidatePath("/admin", "layout");
    redirect("/admin/requests/" + id + "?saved=1");
  },
  accepted(requestId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/songs/new?requestId=" + encodeURIComponent(requestId));
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

/** Explicitly confirmed bulk reset of pending/reviewing requests only. */
export async function bulkRejectOpenRequestsAction(cutoffInput: string, confirmation: string) {
  const principal = await requireAdmin();
  if (confirmation !== "REJECT OPEN REQUESTS") {
    return {ok: false as const, message: "Confirmation does not match."};
  }
  const cutoff = new Date(cutoffInput);
  if (!Number.isFinite(cutoff.getTime())) {
    return {ok: false as const, message: "Invalid reset cutoff. Reload and try again."};
  }
  try {
    const modified = await songRequestService.rejectOpenBefore(cutoff, principal.userId);
    revalidatePath("/admin/requests");
    revalidatePath("/admin", "layout");
    return {ok: true as const, modified};
  } catch (error) {
    logger.error("Bulk rejection of open song requests failed", error);
    return {ok: false as const, message: "Unable to reset requests. Please try again."};
  }
}
