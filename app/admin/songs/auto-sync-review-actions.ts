"use server";

import {requireAdmin} from "@/infrastructure/auth";
import {songService,SongIdSchema} from "@/modules/songs";
import {extractYouTubeVideoId} from "@/modules/songs/application/lyric-timing.service";
import {previewAutoSyncSuggestions,type TimingDraft} from "@/modules/songs/application/auto-sync.review";

/**
 * Read-only validation of local experimental suggestion JSON.
 * No persistence, audio uploads or automatic publishing.
 */
export async function previewAutoSyncSuggestionsAction(
  mmid:number,videoId:string,input:unknown,current:TimingDraft,
) {
  await requireAdmin();
  const id=SongIdSchema.parse(mmid);
  const song=await songService.getSongForEdit(id);
  if(!song.lyricsV2)throw new Error("LyricsV2 is required for synchronization");
  if(!(song.youtubeLink??[]).some(url=>extractYouTubeVideoId(url)===videoId))
    throw new Error("Recording must belong to this song");
  return previewAutoSyncSuggestions(song.lyricsV2,videoId,input,current);
}
