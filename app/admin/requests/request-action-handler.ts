import type { SongRequestService } from "@/modules/requests/application/song-request.service";
import { UpdateSongRequestStatusCommandSchema } from "@/modules/requests/application/song-request.validation";
import { SongRequestConflictError } from "@/modules/requests/application/song-request-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { prepareValidatedWrite } from "@/shared/write/validated-write";

export interface RequestActionState {
  message?: string;
  errors?: Record<string, string[]>;
}

export function createRequestActionHandler(dependencies: {
  authorize: () => Promise<unknown>;
  requests: Pick<SongRequestService, "updateStatus">;
  saved: (id: string) => never;
  logFailure: (error: unknown) => void;
}) {
  return {
    async update(id: string, revision: number, _previous: RequestActionState, form: FormData): Promise<RequestActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ id, revision, status: form.get("status") }),
        schema: UpdateSongRequestStatusCommandSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Choose a valid request status.", errors: prepared.errors };

      try {
        await dependencies.requests.updateStatus(prepared.value.id, prepared.value.revision, prepared.value.status);
      } catch (error) {
        if (error instanceof SongRequestConflictError || error instanceof NotFoundError) return { message: error.message };
        dependencies.logFailure(error);
        return { message: "Unable to update the request. Please try again." };
      }
      return dependencies.saved(prepared.value.id);
    },
  };
}
