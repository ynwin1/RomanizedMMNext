"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { songService, generateSongMoodPreview, moodometerService } from "@/modules/songs";
import { artistService } from "@/modules/artists";
import { AdminSongGenerationInputSchema } from "@/modules/admin/application/admin-song-generation.service";
import { after } from "next/server";
import { z } from "zod";
import { createGenerationJob, readGenerationJob, runGenerationJob } from "@/infrastructure/jobs/song-generation";
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
  const principal = await requireAdmin();
  const requestId = z.string().uuid().parse(input.requestId);
  try {
    const parsed = AdminSongGenerationInputSchema.parse({
      burmeseLyrics: input.burmeseLyrics,
      songName: input.songName,
      artistNames: input.artistNames,
    });
    await createGenerationJob(requestId, principal.userId, parsed);
    after(() => runGenerationJob(requestId, principal.userId));
    logger.info("Admin song generation queued", { requestId });
    return { ok: true as const, requestId };
  } catch (error) {
    logger.error("Admin song generation could not start", error, { requestId });
    return { ok: false as const, message: directSongGenerationFailureMessage(error) };
  }
}

export async function getSongGenerationJobAction(requestId: string) {
  const principal = await requireAdmin();
  const id = z.string().uuid().parse(requestId);
  const job = await readGenerationJob(id, principal.userId);
  if (job?.status === "queued") after(() => runGenerationJob(id, principal.userId));
  return job;
}

export async function searchSongArtistsAction(query: string) {
  await requireAdmin();
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const page = await artistService.getAdminList({ q, page: 1, limit: 8 });
  return page.items.map(({ name, slug }) => ({ name, slug }));
}
