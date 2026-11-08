"use server";
import {requireAdmin} from "@/infrastructure/auth";
import {revalidatePath} from "next/cache";
import {generateAndPublishMissingMoodometer} from "@/modules/songs/application/moodometer.bulk-publish";
import {generateSongMoodPreview,moodometerService, SongIdSchema, listMoodometerMissingSongs} from "@/modules/songs";

/** Bounded listing; avoids automatically analyzing the whole catalogue. */
export async function listMissingMoodometerAction() {
 await requireAdmin();
 return listMoodometerMissingSongs();
}
export async function generateMissingMoodometerAndPublishAction(id:number) {
 await requireAdmin();
 const mmid=SongIdSchema.parse(id);
 const candidates=await listMoodometerMissingSongs();
 if(!candidates.some(song=>song.mmid===mmid)) throw new Error("This song is not currently eligible for Moodometer backfill.");
 const result=await generateAndPublishMissingMoodometer(mmid,{
  generate: generateSongMoodPreview,
  saveDraft: (songId,analysis) => moodometerService.saveDraft(songId,analysis),
  publish: (songId,recordId) => moodometerService.publish(songId,recordId),
 });
 revalidatePath("/[locale]/song/[name]/[id]","page");
 return result;
}
