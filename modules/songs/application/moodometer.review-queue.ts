import type {LyricsV2} from "../domain/lyrics-v2.types";
import {lyricTimingFingerprint} from "./lyric-timing.fingerprint";
export const QUEUE_STATUSES=["missing","draft","published","stale","needs-lyrics"] as const;
export type QueueStatus=typeof QUEUE_STATUSES[number];
export type QueueSong={mmid:number;songName:string;artistName:string;lyricsV2?:LyricsV2};
export type QueueRecord={mmid:number;status:"draft"|"published";lyricsFingerprint:string;createdAt:Date};
export type QueueItem={mmid:number;songName:string;artistName:string;status:QueueStatus;lastAnalyzedAt?:Date};
/** Input records are newest first. Determine status using the newest analysis for current lyrics. */
export function buildMoodReviewQueue(songs:QueueSong[],records:QueueRecord[]):QueueItem[]{
 const byId=new Map<number,QueueRecord[]>();
 for(const r of records){const list=byId.get(r.mmid)??[];list.push(r);byId.set(r.mmid,list)}
 return songs.map(song=>{
   const history=byId.get(song.mmid)??[];
   const base={mmid:song.mmid,songName:song.songName,artistName:song.artistName,...(history[0]?{lastAnalyzedAt:history[0].createdAt}:{})};
   if(!song.lyricsV2)return {...base,status:"needs-lyrics"};
   if(!history.length)return {...base,status:"missing"};
   const fp=lyricTimingFingerprint(song.lyricsV2);
   const current=history.find(r=>r.lyricsFingerprint===fp);
   return {...base,status:current?current.status:"stale"};
 });
}
export function queueStatusCounts(rows:QueueItem[]):Record<QueueStatus,number>{
 const counts:Record<QueueStatus,number>={missing:0,draft:0,published:0,stale:0,"needs-lyrics":0};
 for(const row of rows)counts[row.status]++;
 return counts;
}
