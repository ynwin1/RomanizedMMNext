import test from "node:test";
import assert from "node:assert/strict";
import {lyricTimingFingerprint} from "@/modules/songs/application/lyric-timing.fingerprint";
import {evaluateAutoSync} from "@/modules/songs/application/auto-sync.evaluate";
import {validateAutoSyncPair} from "@/modules/songs/application/auto-sync.contract";

const lyrics={version:2 as const,entries:[
 {kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"love"},
 {kind:"break" as const},
 {kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"love"},
]};
const fp=lyricTimingFingerprint(lyrics);
const reference={version:1 as const,youtubeVideoId:"abcdefghijk",lyricsFingerprint:fp,lines:[
 {entryIndex:0,startMs:1000,endMs:3000},{entryIndex:2,startMs:7000,endMs:9000},
]};
const prediction={version:1 as const,youtubeVideoId:reference.youtubeVideoId,lyricsFingerprint:fp,modelVersion:"prototype",lines:[
 {entryIndex:0,startMs:1500,endMs:4000,confidence:.8},
 {entryIndex:2,startMs:9500,endMs:11000,confidence:.3},
]};

test("scores known timestamps and repeated lyrics by entry index",()=>{
 const metrics=evaluateAutoSync(lyrics,reference,prediction);
 assert.equal(metrics.totalLines,2);
 assert.equal(metrics.predictedLines,2);
 assert.equal(metrics.coverage,1);
 assert.equal(metrics.startWithin1s,.5);
 assert.equal(metrics.endWithin1s,.5);
 assert.equal(metrics.bothWithin1s,.5);
 assert.equal(metrics.meanAbsoluteStartErrorMs,1500);
 assert.equal(metrics.meanAbsoluteEndErrorMs,1500);
 assert.equal(metrics.maxBoundaryErrorMs,2500);
});
test("missing predictions reduce denominator-based accuracy and coverage",()=>{
 const metrics=evaluateAutoSync(lyrics,reference,{...prediction,lines:[prediction.lines[0]]});
 assert.equal(metrics.predictedLines,1);
 assert.equal(metrics.coverage,.5);
 assert.equal(metrics.startWithin1s,.5);
 assert.equal(metrics.endWithin1s,.5);
 assert.equal(metrics.bothWithin1s,.5);
});
test("rejects inconsistent recordings, lyrics versions and missing reference lines",()=>{
 assert.throws(()=>validateAutoSyncPair(lyrics,reference,{...prediction,youtubeVideoId:"anotherVid1"}),/different recordings/);
 assert.throws(()=>validateAutoSyncPair(lyrics,reference,{...prediction,lyricsFingerprint:"a".repeat(64)}),/fingerprint mismatch/);
 assert.throws(()=>validateAutoSyncPair(lyrics,{...reference,lines:reference.lines.slice(0,1)},prediction),/every lyric line/);
});
test("rejects break indices, overlaps, duplicate lines and malformed confidence",()=>{
 assert.throws(()=>validateAutoSyncPair(lyrics,reference,{...prediction,lines:[{entryIndex:1,startMs:100,endMs:200}]}),/does not reference a lyric line/);
 assert.throws(()=>validateAutoSyncPair(lyrics,reference,{...prediction,lines:[{entryIndex:0,startMs:100,endMs:200},{entryIndex:2,startMs:199,endMs:400}]}));
 assert.throws(()=>validateAutoSyncPair(lyrics,reference,{...prediction,lines:[prediction.lines[0],prediction.lines[0]]}));
 assert.throws(()=>validateAutoSyncPair(lyrics,reference,{...prediction,lines:[{...prediction.lines[0],confidence:1.5}]}));
 assert.throws(()=>evaluateAutoSync(lyrics,reference,prediction,-1),/Invalid tolerance/);
});
test("zero predictions return honest zero coverage and null error metrics",()=>{
 const metrics=evaluateAutoSync(lyrics,reference,{...prediction,lines:[]});
 assert.equal(metrics.coverage,0);assert.equal(metrics.bothWithin1s,0);
 assert.equal(metrics.meanAbsoluteStartErrorMs,null);
 assert.equal(metrics.maxBoundaryErrorMs,null);
});
