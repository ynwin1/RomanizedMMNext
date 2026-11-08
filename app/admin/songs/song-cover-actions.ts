"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { songCoverService } from "@/modules/songs";
import { fetchYouTubeCoverMetadata } from "@/modules/songs/application/song-cover.metadata";
import { CreateAdminCoverSchema } from "@/modules/songs/application/song-cover.validation";

/** Preview is an admin-only request to a fixed YouTube oEmbed endpoint. */
export async function previewSongCoverAdminAction(url: string) {
  await requireAdmin();
  const { youtubeUrl } = CreateAdminCoverSchema.pick({ youtubeUrl: true }).parse({ youtubeUrl: url });
  return fetchYouTubeCoverMetadata(youtubeUrl);
}


function refreshSongCovers() {
  revalidatePath("/[locale]/song/[name]/[id]", "page");
}

export async function listSongCoversAdminAction(mmid: number) {
  await requireAdmin();
  return songCoverService.adminList(mmid);
}

export async function addSongCoverAdminAction(mmid: number, input: unknown) {
  const principal = await requireAdmin();
  const result = await songCoverService.adminAdd(mmid, input, principal.userId);
  refreshSongCovers();
  return result;
}

export async function editSongCoverAdminAction(mmid: number, id: string, changes: unknown) {
  await requireAdmin();
  const result = await songCoverService.adminEdit(mmid, id, changes);
  refreshSongCovers();
  return result;
}

export async function removeSongCoverAdminAction(mmid: number, id: string) {
  await requireAdmin();
  await songCoverService.adminRemove(mmid, id);
  refreshSongCovers();
}

export async function reviewSongCoverAdminAction(mmid: number, id: string, decision: "approved" | "rejected") {
  const principal = await requireAdmin();
  const result = await songCoverService.adminReview(mmid, id, decision, principal.userId);
  refreshSongCovers();
  return result;
}

export async function reorderSongCoversAdminAction(mmid: number, ids: string[]) {
  await requireAdmin();
  await songCoverService.adminReorder(mmid, ids);
  refreshSongCovers();
}
