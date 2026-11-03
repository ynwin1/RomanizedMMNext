import test from "node:test";
import assert from "node:assert/strict";
import {buildMoodReviewQueue,queueStatusCounts} from "@/modules/songs/application/moodometer.review-queue";
import {lyricTimingFingerprint} from "@/modules/songs/application/lyric-timing.fingerprint";
const lyrics={version:2 as const,entries:[{kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"I love you"}]};
const changed={...lyrics,entries:[{kind:"line" as const,burmese:"အသစ်",romanized:"a thit",meaning:"New"}]};
const fp=lyricTimingFingerprint(lyrics);const old="b".repeat(64);
const date=new Date("2026-11-01");
const song=(mmid:number,lyricsV2=lyrics)=>({mmid,songName:"Song",artistName:"Artist",lyricsV2});
const rec=(mmid:number,status:"draft"|"published",lyricsFingerprint=fp,createdAt=date)=>({mmid,status,lyricsFingerprint,createdAt});
test("classifies the five review states",()=>{
 const rows=buildMoodReviewQueue([song(1),song(2),song(3),song(4,changed),{mmid:5,songName:"No lyrics",artistName:"Artist"}],
 [rec(2,"draft"),rec(3,"published"),rec(4,"published")]);
 assert.deepEqual(rows.map(r=>r.status),["missing","draft","published","stale","needs-lyrics"]);
 assert.deepEqual(queueStatusCounts(rows),{missing:1,draft:1,published:1,stale:1,"needs-lyrics":1});
});
test("newer stale analysis cannot hide a current published result; current new draft requires review",()=>{
 const rows=buildMoodReviewQueue([song(7),song(8)],[
 rec(7,"draft",old,new Date("2026-11-03")),rec(7,"published"),
 rec(8,"draft",fp,new Date("2026-11-03")),rec(8,"published"),
 ]);
 assert.deepEqual(rows.map(r=>r.status),["published","draft"]);
 assert.equal(rows[0].lastAnalyzedAt?.getTime(),new Date("2026-11-03").getTime());
});
