"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { songService, generateSongMoodPreview, moodometerService } from "@/modules/songs";
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
  async afterCreate(id) {
    const draft = await generateSongMoodPreview(id);
    await moodometerService.saveDraft(id, draft);
  },
  saved(id, moodStatus) {
    revalidatePath("/", "layout");
    redirect("/admin/songs/" + id + "/edit?saved=1" + (moodStatus ? "&mood=" + moodStatus : ""));
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
  requestId: string;
  burmeseLyrics: string;
  songName?: string;
  artistNames?: string[];
}) {
  const requestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId)
    ? input.requestId
    : crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("Admin direct song AI generation requested", { requestId });

  await requireAdmin();
  logger.info("Admin direct song AI generation authorized", { requestId });
  try {
    const service = new AdminSongGenerationService(
      createCatalogueContentGenerationService(),
    );
    const generated = await service.generate(input);
    logger.info("Admin direct song AI generation completed", {
      requestId,
      elapsedMs: Date.now() - startedAt,
    });
    return { ok: true as const, generated };
  } catch (error) {
    logger.error("Admin direct song AI generation failed", error, {
      requestId,
      elapsedMs: Date.now() - startedAt,
    });
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
