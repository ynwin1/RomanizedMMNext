import { z } from "zod";
import type { SongService } from "@/modules/songs/application/song.service";
import { DuplicateSongError, SongConflictError } from "@/modules/songs/application/song-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { songFormInput, songValidationErrors, type SongFormState } from "./song-form.data";

export function createSongActionHandler(dependencies: {
  authorize: () => Promise<unknown>;
  songs: Pick<SongService, "createSong" | "updateSong">;
  saved: (id: number) => never;
  logFailure: (error: unknown) => void;
}) {
  function failure(error: unknown): SongFormState {
    if (error instanceof z.ZodError) return songValidationErrors(error);
    if (error instanceof DuplicateSongError || error instanceof SongConflictError || error instanceof NotFoundError)
      return { message: error.message };
    dependencies.logFailure(error);
    return { message: "Unable to save the song. Please try again." };
  }
  return {
    async create(_previous: SongFormState, form: FormData): Promise<SongFormState> {
      await dependencies.authorize();
      let id: number;
      try { id = (await dependencies.songs.createSong(songFormInput(form, true))).mmid; }
      catch (error) { return failure(error); }
      return dependencies.saved(id);
    },
    async update(id: number, revision: number, _previous: SongFormState, form: FormData): Promise<SongFormState> {
      await dependencies.authorize();
      try { await dependencies.songs.updateSong(id, revision, songFormInput(form, false)); }
      catch (error) { return failure(error); }
      return dependencies.saved(id);
    },
  };
}
