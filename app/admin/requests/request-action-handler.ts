import { z } from "zod";
import type { SongRequestService } from "@/modules/requests/application/song-request.service";
import {
  SongRequestIdSchema,
  SongRequestRevisionSchema,
  UpdateSongRequestStatusCommandSchema,
} from "@/modules/requests/application/song-request.validation";
import { SongRequestConflictError } from "@/modules/requests/application/song-request-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { prepareValidatedWrite, type AdminWritePrincipal } from "@/shared/write/validated-write";

export interface RequestActionState {
  message?: string;
  errors?: Record<string, string[]>;
}

const ReviewDecisionSchema = z.object({
  id: SongRequestIdSchema,
  revision: SongRequestRevisionSchema,
  decision: z.enum(["accept", "reject"]),
}).strict();

export function createRequestActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  requests: Pick<SongRequestService, "updateStatus">;
  acceptRequest: (id: string, revision: number, updatedBy: string) => Promise<{ ingestion: { id: string } }>;
  saved: (id: string) => never;
  accepted: (ingestionId: string) => never;
  rejected: () => never;
  logFailure: (error: unknown) => void;
}) {
  function knownFailure(error: unknown): RequestActionState | null {
    if (error instanceof SongRequestConflictError || error instanceof NotFoundError) {
      return { message: error.message };
    }
    return null;
  }

  return {
    async decide(
      id: string,
      revision: number,
      _previous: RequestActionState,
      form: FormData,
    ): Promise<RequestActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ id, revision, decision: form.get("decision") }),
        schema: ReviewDecisionSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Choose Accept or Reject.", errors: prepared.errors };

      if (prepared.value.decision === "accept") {
        let ingestionId: string;
        try {
          const result = await dependencies.acceptRequest(
            prepared.value.id,
            prepared.value.revision,
            prepared.principal.userId,
          );
          ingestionId = result.ingestion.id;
        } catch (error) {
          const known = knownFailure(error);
          if (known) return known;
          dependencies.logFailure(error);
          return { message: "Unable to review the request. Please try again." };
        }
        return dependencies.accepted(ingestionId);
      }

      try {
        await dependencies.requests.updateStatus(
          prepared.value.id,
          prepared.value.revision,
          "rejected",
          prepared.principal.userId,
        );
      } catch (error) {
        const known = knownFailure(error);
        if (known) return known;
        dependencies.logFailure(error);
        return { message: "Unable to review the request. Please try again." };
      }
      return dependencies.rejected();
    },

    async update(
      id: string,
      revision: number,
      _previous: RequestActionState,
      form: FormData,
    ): Promise<RequestActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ id, revision, status: form.get("status") }),
        schema: UpdateSongRequestStatusCommandSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Choose a valid request status.", errors: prepared.errors };

      try {
        await dependencies.requests.updateStatus(
          prepared.value.id,
          prepared.value.revision,
          prepared.value.status,
          prepared.principal.userId,
        );
      } catch (error) {
        const known = knownFailure(error);
        if (known) return known;
        dependencies.logFailure(error);
        return { message: "Unable to update the request. Please try again." };
      }
      return dependencies.saved(prepared.value.id);
    },
  };
}
