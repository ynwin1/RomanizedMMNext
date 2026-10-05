import type { SongService } from "@/modules/songs/application/song.service";
import { CreateSongSchema, UpdateSongCommandSchema } from "@/modules/songs/application/song.validation";
import { CanonicalLyricsRequiredError, DuplicateSongError, SongConflictError } from "@/modules/songs/application/song-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { prepareValidatedWrite, type AdminWritePrincipal } from "@/shared/write/validated-write";
import { songFormInput, type SongFormState } from "./song-form.data";

export function createSongActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  songs: Pick<SongService, "createSong" | "updateSong">;
  saved: (id: number) => never;
  logFailure: (error: unknown) => void;
}) {
  function failure(error: unknown): SongFormState {
    if (
      error instanceof CanonicalLyricsRequiredError
      || error instanceof DuplicateSongError
      || error instanceof SongConflictError
      || error instanceof NotFoundError
    ) return { message: error.message };
    dependencies.logFailure(error);
    return { message: "Unable to save the song. Please try again." };
  }

  return {
    async create(_previous: SongFormState, form: FormData): Promise<SongFormState> {
      const prepared = await prepareValidatedWrite({
        parse: () => songFormInput(form, true),
        schema: CreateSongSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Please correct the highlighted fields.", errors: prepared.errors };

      let id: number;
      try {
        id = (await dependencies.songs.createSong(prepared.value, prepared.principal.userId)).mmid;
      } catch (error) {
        return failure(error);
      }
      return dependencies.saved(id);
    },

    async update(id: number, revision: number, _previous: SongFormState, form: FormData): Promise<SongFormState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ id, revision, input: songFormInput(form, false) }),
        schema: UpdateSongCommandSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Please correct the highlighted fields.", errors: prepared.errors };

      try {
        await dependencies.songs.updateSong(prepared.value.id, prepared.value.revision, prepared.value.input, prepared.principal.userId);
      } catch (error) {
        return failure(error);
      }
      return dependencies.saved(prepared.value.id);
    },
  };
}
