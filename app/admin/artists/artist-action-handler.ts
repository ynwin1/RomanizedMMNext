import type { ArtistService } from "@/modules/artists/application/artist.service";
import { CreateArtistSchema, UpdateArtistCommandSchema } from "@/modules/artists/application/artist.validation";
import { ArtistConflictError, DuplicateArtistError } from "@/modules/artists/application/artist-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { prepareValidatedWrite, type AdminWritePrincipal } from "@/shared/write/validated-write";
import { artistFormInput, type ArtistFormState } from "./artist-form.data";

export function createArtistActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  artists: Pick<ArtistService, "createArtist" | "updateArtist">;
  saved: (slug: string) => never;
  logFailure: (error: unknown) => void;
}) {
  function failure(error: unknown): ArtistFormState {
    if (error instanceof DuplicateArtistError || error instanceof ArtistConflictError || error instanceof NotFoundError) {
      return { message: error.message };
    }
    dependencies.logFailure(error);
    return { message: "Unable to save the artist. Please try again." };
  }

  return {
    async create(_previous: ArtistFormState, form: FormData): Promise<ArtistFormState> {
      const prepared = await prepareValidatedWrite({
        parse: () => artistFormInput(form, true),
        schema: CreateArtistSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Please correct the highlighted fields.", errors: prepared.errors };

      let slug: string;
      try {
        slug = (await dependencies.artists.createArtist(prepared.value, prepared.principal.userId)).slug;
      } catch (error) {
        return failure(error);
      }
      return dependencies.saved(slug);
    },

    async update(slug: string, revision: number, _previous: ArtistFormState, form: FormData): Promise<ArtistFormState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ slug, revision, input: artistFormInput(form, false) }),
        schema: UpdateArtistCommandSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Please correct the highlighted fields.", errors: prepared.errors };

      try {
        await dependencies.artists.updateArtist(prepared.value.slug, prepared.value.revision, prepared.value.input, prepared.principal.userId);
      } catch (error) {
        return failure(error);
      }
      return dependencies.saved(prepared.value.slug);
    },
  };
}
