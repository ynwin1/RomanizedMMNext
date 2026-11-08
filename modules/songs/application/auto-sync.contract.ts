import {z} from "zod";
import type {LyricsV2} from "../domain/lyrics-v2.types";
import {lyricTimingFingerprint} from "./lyric-timing.fingerprint";
import {parseLyricTimingTrack} from "./lyric-timing.validation";

/** Data-only evaluation input. Audio bytes and credentials do not belong here. */
const videoId=z.string().regex(/^[a-zA-Z0-9_-]{11}$/);
const fingerprint=z.string().regex(/^[a-f0-9]{64}$/);
const timeMs=z.number().int().nonnegative().max(86_400_000);
const timedLineBase=z.object({
  entryIndex:z.number().int().nonnegative(),
  startMs:timeMs,
  endMs:timeMs,
}).strict();
const timedLine=timedLineBase.refine(line=>line.endMs>line.startMs,"End must be later than start");

export const AutoSyncReferenceSchema=z.object({
  version:z.literal(1),
  youtubeVideoId:videoId,
  lyricsFingerprint:fingerprint,
  /** Reference intervals verified against the exact recording. */
  lines:z.array(timedLine).max(5000),
}).strict();

export const AutoSyncSuggestionSchema=z.object({
  version:z.literal(1),
  youtubeVideoId:videoId,
  lyricsFingerprint:fingerprint,
  /** The algorithm may deliberately omit low-confidence lyric lines. */
  lines:z.array(timedLineBase.extend({
    confidence:z.number().finite().min(0).max(1).optional(),
  }).refine(line=>line.endMs>line.startMs,"End must be later than start")).max(5000),
  modelVersion:z.string().trim().min(1).max(100),
}).strict();

export type AutoSyncReference=z.infer<typeof AutoSyncReferenceSchema>;
export type AutoSyncSuggestion=z.infer<typeof AutoSyncSuggestionSchema>;

/** Reuse the production line/ordering/overlap rules, without persisting or publishing. */
export function validateAutoSyncPair(
  lyrics:LyricsV2,
  referenceInput:unknown,
  suggestionInput:unknown,
):{reference:AutoSyncReference;suggestion:AutoSyncSuggestion}{
  const reference=AutoSyncReferenceSchema.parse(referenceInput);
  const suggestion=AutoSyncSuggestionSchema.parse(suggestionInput);
  const expected=lyricTimingFingerprint(lyrics);
  if(reference.youtubeVideoId!==suggestion.youtubeVideoId)throw new Error("Reference and suggestion use different recordings");
  if(reference.lyricsFingerprint!==expected||suggestion.lyricsFingerprint!==expected)throw new Error("Lyrics fingerprint mismatch");
  const toTrack=(lines:Array<{entryIndex:number;startMs:number;endMs:number}>)=>({
    version:1 as const,youtubeVideoId:reference.youtubeVideoId,lyricsFingerprint:expected,
    status:"draft" as const,lines:lines.map(({entryIndex,startMs,endMs})=>({entryIndex,startMs,endMs})),
  });
  parseLyricTimingTrack(toTrack(reference.lines),lyrics);
  parseLyricTimingTrack(toTrack(suggestion.lines),lyrics);
  const expectedIndices=lyrics.entries.flatMap((entry,i)=>entry.kind==="line"?[i]:[]);
  if(reference.lines.length!==expectedIndices.length)throw new Error("Reference must cover every lyric line");
  return {reference,suggestion};
}
