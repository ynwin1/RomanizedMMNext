import type {LyricsV2} from "../domain/lyrics-v2.types";
import type {LyricTimingTrack} from "../domain/lyric-timing.types";
import {parseLyricsV2} from "./lyrics-v2.validation";
import {lyricTimingFingerprint} from "./lyric-timing.fingerprint";
import {parseLyricTimingTrack} from "./lyric-timing.validation";
import {AutoSyncReferenceSchema} from "./auto-sync.contract";

/**
 * Admin-only export data. A published track is eligible as a *candidate*
 * reference, but an editor must still confirm that its timings were reviewed.
 */
export function createAutoSyncReferenceExport(
  mmid:number,
  lyricsInput:unknown,
  trackInput:unknown,
){
  if(!Number.isSafeInteger(mmid)||mmid<=0)throw new Error("Invalid song ID");
  const lyrics:LyricsV2=parseLyricsV2(lyricsInput);
  const track:LyricTimingTrack=parseLyricTimingTrack(trackInput,lyrics);
  if(track.status!=="published")throw new Error("Only published timing tracks can be exported");
  if(track.lyricsFingerprint!==lyricTimingFingerprint(lyrics))
    throw new Error("Track is stale for current LyricsV2");
  const reference=AutoSyncReferenceSchema.parse({
    version:1,
    youtubeVideoId:track.youtubeVideoId,
    lyricsFingerprint:track.lyricsFingerprint,
    lines:track.lines.map(({entryIndex,startMs,endMs})=>({entryIndex,startMs,endMs})),
  });
  return {
    version:1 as const,
    mmid,
    lyrics,
    reference,
  };
}
