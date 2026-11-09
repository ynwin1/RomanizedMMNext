import test from "node:test";
import assert from "node:assert/strict";
import {previewAutoSyncSuggestions} from "@/modules/songs/application/auto-sync.review";
import {lyricTimingFingerprint} from "@/modules/songs/application/lyric-timing.fingerprint";
const lyrics={version:2 as const,entries:[
 {kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:null},
 {kind:"break" as const},
 {kind:"line" as const,burmese:"အိပ်မက်တွေအားလုံး",romanized:"eik met",meaning:null},
]};
const fingerprint=lyricTimingFingerprint(lyrics);
const suggestion={version:1 as const,youtubeVideoId:"abcdefghijk",lyricsFingerprint:fingerprint,
 modelVersion:"whisper-segment-lexical-v1",lines:[
  {entryIndex:0,startMs:1000,endMs:2900,confidence:.95},
  {entryIndex:2,startMs:4800,endMs:7200,confidence:.86},
 ]};
test("fills empty lyric lines from matcher output without automatically publishing",()=>{
 const preview=previewAutoSyncSuggestions(lyrics,"abcdefghijk",{suggestion},{});
 assert.equal(preview.addedCount,2);
 assert.equal(preview.keptCount,0);
 assert.equal(preview.totalLines,2);
 assert.equal(preview.modelVersion,"whisper-segment-lexical-v1");
 assert.deepEqual(preview.nextTimes,{0:{startMs:1000,endMs:2900},2:{startMs:4800,endMs:7200}});
});
test("never overwrites manually timed rows, including incomplete work",()=>{
 const current={0:{startMs:500,endMs:3000},2:{startMs:4900}};
 const preview=previewAutoSyncSuggestions(lyrics,"abcdefghijk",suggestion,current);
 assert.equal(preview.addedCount,0);
 assert.equal(preview.keptCount,2);
 assert.deepEqual(preview.nextTimes,current);
 assert.notEqual(preview.nextTimes,current);
});
test("merges only unfilled lines and retains other timestamps",()=>{
 const current={0:{startMs:800,endMs:3500}};
 const preview=previewAutoSyncSuggestions(lyrics,"abcdefghijk",suggestion,current);
 assert.equal(preview.addedCount,1);
 assert.equal(preview.keptCount,1);
 assert.deepEqual(preview.nextTimes[0],current[0]);
 assert.deepEqual(preview.nextTimes[2],{startMs:4800,endMs:7200});
});
test("rejects recording mismatch, changed lyrics and invalid schema",()=>{
 assert.throws(()=>previewAutoSyncSuggestions(lyrics,"123456789ab",suggestion,{}),/different YouTube recording/);
 assert.throws(()=>previewAutoSyncSuggestions(lyrics,"abcdefghijk",{...suggestion,lyricsFingerprint:"a".repeat(64)},{}),/stale/);
 assert.throws(()=>previewAutoSyncSuggestions(lyrics,"abcdefghijk",{...suggestion,lines:[{entryIndex:1,startMs:100,endMs:200}]},{}));
 assert.throws(()=>previewAutoSyncSuggestions(lyrics,"abcdefghijk",{...suggestion,lines:[{entryIndex:0,startMs:200,endMs:100}]},{}));
 assert.throws(()=>previewAutoSyncSuggestions(lyrics,"abcdefghijk",{...suggestion,modelVersion:""},{}));
});
test("rejects import if merging would overlap an existing timing row",()=>{
 assert.throws(()=>previewAutoSyncSuggestions(lyrics,"abcdefghijk",suggestion,
  {0:{startMs:1000,endMs:6000}}),/overlap/i);
});
test("rejects invalid current draft entries rather than silently discarding them",()=>{
 assert.throws(()=>previewAutoSyncSuggestions(lyrics,"abcdefghijk",suggestion,
  {1:{startMs:100,endMs:200}}),/invalid entries/);
});

test("read-only server action requires admin and checks recording association",async()=>{
 const {readFileSync}=await import("node:fs");
 const action=readFileSync("app/admin/songs/auto-sync-review-actions.ts","utf8");
 assert.match(action,/await requireAdmin\(\)/);
 assert.match(action,/extractYouTubeVideoId\(url\)===videoId/);
 assert.match(action,/previewAutoSyncSuggestions\(song\.lyricsV2,videoId,input,current\)/);
 assert.doesNotMatch(action,/\.save\(|\.create\(|\.publish\(/);
});
