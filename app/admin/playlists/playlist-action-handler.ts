import {z} from "zod";
import type {PlaylistService} from "@/modules/playlists/application/playlist.service";
import {PlaylistInputSchema, PlaylistIdSchema, PlaylistRevisionSchema, PlaylistStatusSchema} from "@/modules/playlists/application/playlist.validation";
import {DuplicatePlaylistError, PlaylistConflictError} from "@/modules/playlists/application/playlist-write.error";
import {NotFoundError} from "@/shared/errors/not-found.error";
import {prepareValidatedWrite, zodFieldErrors, type AdminWritePrincipal} from "@/shared/write/validated-write";
import {playlistFormInput, type PlaylistFormState} from "./playlist-form.data";

const EditCommand = z.object({id: PlaylistIdSchema, revision: PlaylistRevisionSchema, input: PlaylistInputSchema});
const StatusCommand = z.object({id: PlaylistIdSchema, revision: PlaylistRevisionSchema, status: PlaylistStatusSchema});

export function createPlaylistActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  playlists: Pick<PlaylistService, "create" | "update" | "setStatus">;
  saved: (id: string) => never;
  logFailure: (error: unknown) => void;
}) {
  function failure(error: unknown): PlaylistFormState {
    if (error instanceof z.ZodError) return {message: "Please correct the highlighted fields.", errors: zodFieldErrors(error)};
    if (error instanceof DuplicatePlaylistError || error instanceof PlaylistConflictError || error instanceof NotFoundError) {
      return {message: error.message};
    }
    dependencies.logFailure(error);
    return {message: "Unable to save the playlist. Please try again."};
  }

  return {
    async create(_state: PlaylistFormState, form: FormData): Promise<PlaylistFormState> {
      const prepared = await prepareValidatedWrite({parse: () => playlistFormInput(form), schema: PlaylistInputSchema, authorize: dependencies.authorize});
      if (!prepared.ok) return {message: "Please correct the highlighted fields.", errors: prepared.errors};
      let id: string;
      try { id = (await dependencies.playlists.create(prepared.value, prepared.principal.userId)).id; }
      catch (error) { return failure(error); }
      return dependencies.saved(id);
    },

    async update(id: string, revision: number, _state: PlaylistFormState, form: FormData): Promise<PlaylistFormState> {
      const prepared = await prepareValidatedWrite({parse: () => ({id, revision, input: playlistFormInput(form)}), schema: EditCommand, authorize: dependencies.authorize});
      if (!prepared.ok) return {message: "Please correct the highlighted fields.", errors: prepared.errors};
      try { await dependencies.playlists.update(prepared.value.id, prepared.value.revision, prepared.value.input, prepared.principal.userId); }
      catch (error) { return failure(error); }
      return dependencies.saved(prepared.value.id);
    },

    async setStatus(id: string, revision: number, _state: PlaylistFormState, form: FormData): Promise<PlaylistFormState> {
      const prepared = await prepareValidatedWrite({parse: () => ({id, revision, status: form.get("status")}), schema: StatusCommand, authorize: dependencies.authorize});
      if (!prepared.ok) return {message: "Invalid status or stale revision.", errors: prepared.errors};
      try { await dependencies.playlists.setStatus(prepared.value.id, prepared.value.revision, prepared.value.status, prepared.principal.userId); }
      catch (error) { return failure(error); }
      return dependencies.saved(prepared.value.id);
    },
  };
}
