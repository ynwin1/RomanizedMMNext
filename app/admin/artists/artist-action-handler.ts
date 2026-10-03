import { z } from "zod";
import type { ArtistService } from "@/modules/artists/application/artist.service";
import { ArtistConflictError, DuplicateArtistError } from "@/modules/artists/application/artist-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { artistFormInput, artistValidationErrors, type ArtistFormState } from "./artist-form.data";

export function createArtistActionHandler(dependencies: {
  authorize: () => Promise<unknown>;
  artists: Pick<ArtistService, "createArtist" | "updateArtist">;
  saved: (slug: string) => never;
  logFailure: (error: unknown) => void;
}) {
  function failure(error: unknown): ArtistFormState {
    if (error instanceof z.ZodError) return artistValidationErrors(error);
    if (error instanceof DuplicateArtistError || error instanceof ArtistConflictError || error instanceof NotFoundError) {
      return { message: error.message };
    }
    dependencies.logFailure(error);
    return { message: "Unable to save the artist. Please try again." };
  }

  return {
    async create(_previous: ArtistFormState, form: FormData): Promise<ArtistFormState> {
      await dependencies.authorize();
      let slug: string;
      try { slug = (await dependencies.artists.createArtist(artistFormInput(form, true))).slug; }
      catch (error) { return failure(error); }
      return dependencies.saved(slug);
    },

    async update(slug: string, revision: number, _previous: ArtistFormState, form: FormData): Promise<ArtistFormState> {
      await dependencies.authorize();
      try { await dependencies.artists.updateArtist(slug, revision, artistFormInput(form, false)); }
      catch (error) { return failure(error); }
      return dependencies.saved(slug);
    },
  };
}
