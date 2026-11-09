"use server";

import {requireAdmin} from "@/infrastructure/auth";
import {songService,SongIdSchema,lyricTimingService} from "@/modules/songs";
import {createAutoSyncReferenceExport} from "@/modules/songs/application/auto-sync.reference-export";

/** No writes or audio access; reject missing, stale, incomplete and draft timings. */
export async function exportAutoSyncReferenceAction(mmid:number,videoId:string) {
  await requireAdmin();
  const id=SongIdSchema.parse(mmid);
  const song=await songService.getSongForEdit(id);
  if(!song.lyricsV2)throw new Error("LyricsV2 is required");
  const track=await lyricTimingService.load(id,videoId,true);
  if(!track)throw new Error("No current published timing track for this recording");
  return createAutoSyncReferenceExport(id,song.lyricsV2,track);
}
