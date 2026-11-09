import test from "node:test";
import assert from "node:assert/strict";
import {evaluateAutoSyncDataset,type BenchmarkSample} from "@/modules/songs/application/auto-sync.dataset";
import {lyricTimingFingerprint} from "@/modules/songs/application/lyric-timing.fingerprint";

const lyrics={version:2 as const,entries:[
 {kind:"line" as const,burmese:"မင်္ဂလာပါ",romanized:"mingalar par",meaning:"Hello"},
 {kind:"break" as const},
 {kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"Love"},
]};
const fingerprint=lyricTimingFingerprint(lyrics);
const sample=(mmid:number,source=true,vocals=true):BenchmarkSample=>{
 const reference={version:1 as const,youtubeVideoId:"abcdefghijk",lyricsFingerprint:fingerprint,
  lines:[{entryIndex:0,startMs:1000,endMs:2000},{entryIndex:2,startMs:5000,endMs:7000}]};
 return {mmid,lyrics,reference,
  source:source?{version:1,modelVersion:"raw-v1",youtubeVideoId:"abcdefghijk",lyricsFingerprint:fingerprint,
   lines:[{entryIndex:0,startMs:1200,endMs:2800,confidence:.8}]}:undefined,
  vocals:vocals?{version:1,modelVersion:"vocals-v1",youtubeVideoId:"abcdefghijk",lyricsFingerprint:fingerprint,
   lines:[{entryIndex:0,startMs:1500,endMs:2500,confidence:.9},
    {entryIndex:2,startMs:5000,endMs:7500,confidence:.9}]}:undefined,
  manualMinutes:20,assistedMinutes:8};
};
test("aggregates accuracy over ALL reference lines, not only predicted lines",()=>{
 const out=evaluateAutoSyncDataset([sample(1)]);
 assert.equal(out.source.coverage,.5);
 assert.equal(out.source.startWithin1s,.5);
 assert.equal(out.source.endWithin1s,.5);
 assert.equal(out.source.bothWithin1s,.5);
 assert.equal(out.source.meanAbsoluteStartErrorMs,200);
 assert.equal(out.vocals.coverage,1);
 assert.equal(out.vocals.bothWithin1s,1);
 assert.equal(out.editingTime.savingsRatio,.6);
 assert.equal(out.decision,"insufficient_evidence");
 assert.equal(out.worstLines[0].startErrorMs,null);
});
test("paired comparison ignores source-only recording for fair analysis",()=>{
 const out=evaluateAutoSyncDataset([sample(1),sample(2,true,false)]);
 assert.equal(out.source.evaluatedSongs,2);
 assert.equal(out.vocals.evaluatedSongs,1);
 assert.equal(out.pairedSongs,1);
 assert.equal(out.pairedSource.evaluatedSongs,1);
 assert.equal(out.pairedVocals.evaluatedSongs,1);
});
test("five well-scored paired songs plus real editing measurements yield review candidate",()=>{
 const items=Array.from({length:5},(_,i)=>sample(i+1));
 const good=items.map(s=>({...s,source:s.vocals}));
 const out=evaluateAutoSyncDataset(good);
 assert.equal(out.decision,"candidate_for_review");
 assert.equal(out.numberOfSongs,5);
 assert.equal(out.pairedVocals.referenceLines,10);
 assert.equal(out.pairedSource.predictedLines,10);
});
test("five complete but slow results require more alignment work",()=>{
 const items=Array.from({length:5},(_,i)=>({...sample(i+1),assistedMinutes:19}));
 assert.equal(evaluateAutoSyncDataset(items).decision,"investigate_alignment");
});
test("rejects corrupted, mismatched and fabricated data",()=>{
 assert.throws(()=>evaluateAutoSyncDataset([]),/1–100/);
 assert.throws(()=>evaluateAutoSyncDataset([sample(1),sample(1)]),/Duplicate/);
 assert.throws(()=>evaluateAutoSyncDataset([{...sample(1),source:undefined,vocals:undefined}]),/At least one/);
 assert.throws(()=>evaluateAutoSyncDataset([{...sample(1),manualMinutes:-1}]),/Invalid editing/);
 assert.throws(()=>evaluateAutoSyncDataset([{...sample(1),assistedMinutes:undefined}]),/Both manual/);
 assert.throws(()=>evaluateAutoSyncDataset([{...sample(1),source:{...sample(1).source!,youtubeVideoId:"xyz12345678"}}]),/different recordings/);
 assert.throws(()=>evaluateAutoSyncDataset([{...sample(1),vocals:{...sample(1).vocals!,lyricsFingerprint:"a".repeat(64)}}]),/fingerprint mismatch/);
});
test("missing predictions never contribute fabricated zero error averages",()=>{
 const s=sample(1);s.source={...s.source!,lines:[]};
 const out=evaluateAutoSyncDataset([s]);
 assert.equal(out.source.meanAbsoluteStartErrorMs,null);
 assert.equal(out.source.startWithin1s,0);
 assert.equal(out.source.coverage,0);
 assert.equal(out.worstLines.filter(l=>l.variant==="source"&&l.startErrorMs===null).length,2);
});
