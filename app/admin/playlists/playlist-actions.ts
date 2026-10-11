"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {requireAdmin} from "@/infrastructure/auth";
import {playlistService} from "@/modules/playlists";
import {logger} from "@/infrastructure/logging/logger";
import {createPlaylistActionHandler} from "./playlist-action-handler";
import type {PlaylistFormState} from "./playlist-form.data";

const actions = createPlaylistActionHandler({
  authorize: requireAdmin,
  playlists: playlistService,
  saved(id) {
    revalidatePath("/admin/playlists");
    redirect(`/admin/playlists/${id}/edit?saved=1`);
  },
  logFailure(error) {logger.error("Admin playlist save failed", error);},
});

export async function createPlaylistAction(state: PlaylistFormState, form: FormData): Promise<PlaylistFormState> {
  return actions.create(state, form);
}

export async function updatePlaylistAction(id: string, revision: number, state: PlaylistFormState, form: FormData): Promise<PlaylistFormState> {
  return actions.update(id, revision, state, form);
}

export async function changePlaylistStatusAction(id: string, revision: number, state: PlaylistFormState, form: FormData): Promise<PlaylistFormState> {
  return actions.setStatus(id, revision, state, form);
}
