"use server";
import {requireAdmin} from "@/infrastructure/auth";
import {generateSongMoodPreview,moodometerService, SongIdSchema, listMoodometerMissingSongs} from "@/modules/songs";

/** Bounded listing; avoids automatically analyzing the whole catalogue. */
export async function listMissingMoodometerAction() {
 await requireAdmin();
 return listMoodometerMissingSongs();
}
export async function generateMissingMoodometerDraftAction(id:number) {
 await requireAdmin();
 const mmid=SongIdSchema.parse(id);
 const candidates=await listMoodometerMissingSongs();
 if(!candidates.some(song=>song.mmid===mmid)) throw new Error("This song is not currently eligible for a missing Moodometer draft.");
 const draft=await generateSongMoodPreview(mmid);
 const record=await moodometerService.saveDraft(mmid,draft);
 return {mmid,recordId:record.id};
}
