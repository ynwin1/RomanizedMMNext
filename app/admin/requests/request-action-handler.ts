import { z } from "zod";
import type { SongRequestService } from "@/modules/requests/application/song-request.service";
import { SongRequestConflictError } from "@/modules/requests/application/song-request-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";

export interface RequestActionState { message?: string; }

export function createRequestActionHandler(dependencies: {
  authorize: () => Promise<unknown>;
  requests: Pick<SongRequestService, "updateStatus">;
  saved: (id: string) => never;
  logFailure: (error: unknown) => void;
}) {
  return {
    async update(id: string, revision: number, _previous: RequestActionState, form: FormData): Promise<RequestActionState> {
      await dependencies.authorize();
      try {
        await dependencies.requests.updateStatus(id, revision, form.get("status"));
      } catch (error) {
        if (error instanceof z.ZodError) return { message: "Choose a valid request status." };
        if (error instanceof SongRequestConflictError || error instanceof NotFoundError) return { message: error.message };
        dependencies.logFailure(error);
        return { message: "Unable to update the request. Please try again." };
      }
      return dependencies.saved(id);
    },
  };
}
