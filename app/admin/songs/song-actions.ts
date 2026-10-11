"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { songService } from "@/modules/songs";
import { artistService } from "@/modules/artists";
import { AdminSongGenerationService } from "@/modules/admin";
import { createCatalogueContentGenerationService } from "@/integrations/ai/create-catalogue-content-generation.service";
import { logger } from "@/infrastructure/logging/logger";
import { directSongGenerationFailureMessage } from "./song-generation-error";
import { createSongActionHandler } from "./song-action-handler";
import type { SongFormState } from "./song-form.data";

const actions = createSongActionHandler({
  authorize: requireAdmin,
  songs: songService,
  saved(id) {
    revalidatePath("/", "layout");
    redirect("/admin/songs/" + id + "/edit?saved=1");
  },
  logFailure(error) { logger.error("Admin song save failed", error); },
});

export async function createSongAction(previous: SongFormState, form: FormData): Promise<SongFormState> {
  return actions.create(previous, form);
}
export async function updateSongAction(id: number, revision: number, previous: SongFormState, form: FormData): Promise<SongFormState> {
  return actions.update(id, revision, previous, form);
}


export async function generateSongAiContentAction(input: {
  burmeseLyrics: string;
  songName?: string;
  artistNames?: string[];
}) {
  await requireAdmin();
  try {
    const service = new AdminSongGenerationService(
      createCatalogueContentGenerationService(),
    );
    return { ok: true as const, generated: await service.generate(input) };
  } catch (error) {
    logger.error("Admin direct song AI generation failed", error);
    return {
      ok: false as const,
      message: directSongGenerationFailureMessage(error),
    };
  }
}

export async function searchSongArtistsAction(query: string) {
  await requireAdmin();
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const page = await artistService.getAdminList({ q, page: 1, limit: 8 });
  return page.items.map(({ name, slug }) => ({ name, slug }));
}
