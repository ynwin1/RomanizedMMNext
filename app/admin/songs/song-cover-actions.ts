"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { songCoverService } from "@/modules/songs";

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
