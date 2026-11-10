import {AutoSyncSuggestionSchema} from "./auto-sync.contract";
import {parseLyricTimingTrack} from "./lyric-timing.validation";
import {lyricTimingFingerprint} from "./lyric-timing.fingerprint";
import {parseLyricsV2} from "./lyrics-v2.validation";
import type {LyricsV2} from "../domain/lyrics-v2.types";

type TimingRow={startMs?:number;endMs?:number};
export type TimingDraft=Record<number,TimingRow>;
export interface AutoSyncReviewPreview {
  candidateCount:number;
  addedCount:number;
  keptCount:number;
  totalLines:number;
  modelVersion:string;
  nextTimes:TimingDraft;
}

/** Accept either a standalone suggestion or the offline matcher report. */
export function previewAutoSyncSuggestions(
  lyricsInput:unknown,
  recordingId:string,
  suggestionInput:unknown,
  current:TimingDraft,
):AutoSyncReviewPreview {
  const lyrics:LyricsV2=parseLyricsV2(lyricsInput);
  const raw=suggestionInput && typeof suggestionInput==="object" &&
    "suggestion" in suggestionInput ?
    (suggestionInput as {suggestion:unknown}).suggestion : suggestionInput;
  const suggestion=AutoSyncSuggestionSchema.parse(raw);
  if(suggestion.youtubeVideoId!==recordingId) {
    throw new Error("Suggestions belong to a different YouTube recording.");
  }
  const currentFingerprint=lyricTimingFingerprint(lyrics);
  if(suggestion.lyricsFingerprint!==currentFingerprint) {
    throw new Error("Suggestions are stale: LyricsV2 has changed since generation.");
  }
  // Validate against the production draft rules for breaks, ordering,
  // overlaps and duplicate indices before any client-side timing is changed.
  parseLyricTimingTrack({
    version:1,youtubeVideoId:suggestion.youtubeVideoId,
    lyricsFingerprint:suggestion.lyricsFingerprint,status:"draft",
    lines:suggestion.lines.map(({entryIndex,startMs,endMs})=>({entryIndex,startMs,endMs})),
  },lyrics);

  const allowed=new Set(lyrics.entries.flatMap((entry,index)=>entry.kind==="line"?[index]:[]));
  const nextTimes:TimingDraft={};
  for(const [key,value] of Object.entries(current)){
    const index=Number(key);
    if(!Number.isSafeInteger(index)||!allowed.has(index)||
       !value||typeof value!=="object")throw new Error("Existing timing draft contains invalid entries.");
    nextTimes[index]={...value};
  }
  let addedCount=0,keptCount=0;
  for(const line of suggestion.lines){
    const existing=nextTimes[line.entryIndex];
    // Partially entered rows count as existing work and are NEVER replaced.
    if(existing?.startMs!==undefined||existing?.endMs!==undefined){
      keptCount++;
      continue;
    }
    nextTimes[line.entryIndex]={startMs:line.startMs,endMs:line.endMs};
    addedCount++;
  }
  // The combination of independently valid suggestions and existing manual
  // timings can still overlap. Reject the whole import, not just some rows.
  const combined=Object.entries(nextTimes)
    .filter(([,value])=>value.startMs!==undefined&&value.endMs!==undefined)
    .map(([index,value])=>({entryIndex:Number(index),startMs:value.startMs!,endMs:value.endMs!}))
    .sort((a,b)=>a.entryIndex-b.entryIndex);
  parseLyricTimingTrack({
    version:1,youtubeVideoId:recordingId,lyricsFingerprint:currentFingerprint,
    status:"draft",lines:combined,
  },lyrics);
  return {candidateCount:suggestion.lines.length,addedCount,keptCount,
    totalLines:allowed.size,modelVersion:suggestion.modelVersion,nextTimes};
}
