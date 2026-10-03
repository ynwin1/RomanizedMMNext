"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { artistService } from "@/modules/artists";
import { logger } from "@/infrastructure/logging/logger";
import { createArtistActionHandler } from "./artist-action-handler";
import type { ArtistFormState } from "./artist-form.data";

const actions = createArtistActionHandler({
  authorize: requireAdmin,
  artists: artistService,
  saved(slug) {
    revalidatePath("/", "layout");
    redirect("/admin/artists/" + encodeURIComponent(slug) + "/edit?saved=1");
  },
  logFailure(error) { logger.error("Admin artist save failed", error); },
});

export async function createArtistAction(previous: ArtistFormState, form: FormData): Promise<ArtistFormState> {
  return actions.create(previous, form);
}

export async function updateArtistAction(slug: string, revision: number, previous: ArtistFormState, form: FormData): Promise<ArtistFormState> {
  return actions.update(slug, revision, previous, form);
}
