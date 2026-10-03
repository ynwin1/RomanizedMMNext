"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { songService } from "@/modules/songs";
import { logger } from "@/infrastructure/logging/logger";
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
