"use server";
import { requireAdmin } from "@/infrastructure/auth";
import { moodometerService, SongIdSchema } from "@/modules/songs";
import { revalidatePath } from "next/cache";
export async function saveMoodometerDraftAction(mmid:number,analysis:unknown) {
  await requireAdmin();
  return moodometerService.saveDraft(SongIdSchema.parse(mmid),analysis);
}
export async function getMoodometerHistoryAction(mmid:number) {
  await requireAdmin();
  return moodometerService.history(SongIdSchema.parse(mmid));
}
export async function publishMoodometerAction(mmid:number,id:string) {
  await requireAdmin();
  const result=await moodometerService.publish(SongIdSchema.parse(mmid),id);
  revalidatePath("/[locale]/song/[name]/[id]","page");
  return result;
}
