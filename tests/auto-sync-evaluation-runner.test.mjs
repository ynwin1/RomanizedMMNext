import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createRequire} from "node:module";
import {evaluateTranscriptionBatch,saveTranscriptionBatch} from "../scripts/auto-sync-evaluation-runner.mjs";

const require=createRequire(import.meta.url);
const {suggestAutoSyncFromTranscript}=require("../.test-dist/modules/songs/application/auto-sync.match.js");
const {evaluateAutoSyncDataset}=require("../.test-dist/modules/songs/application/auto-sync.dataset.js");
const {lyricTimingFingerprint}=require("../.test-dist/modules/songs/application/lyric-timing.fingerprint.js");
const lyrics={version:2,entries:[
 {kind:"line",burmese:"ချစ်သူကိုလွမ်းတယ်",romanized:"chit thu ko lwan tal",meaning:null},
 {kind:"break"},
 {kind:"line",burmese:"အိပ်မက်တွေရှိတယ်",romanized:"eik met dway shi tal",meaning:null},
]};
const fingerprint=lyricTimingFingerprint(lyrics);
const reference={version:1,mmid:205,lyrics,reference:{
 version:1,youtubeVideoId:"abcdefghijk",lyricsFingerprint:fingerprint,
 lines:[{entryIndex:0,startMs:1000,endMs:3000},{entryIndex:2,startMs:5000,endMs:7000}],
}};
const segments=[{startMs:1100,endMs:2900,text:"ချစ်သူကိုလွမ်းတယ်"},
 {startMs:5200,endMs:7100,text:"အိပ်မက်တွေရှိတယ်"}];
const trans=(variant)=>({
 version:1,youtubeVideoId:"abcdefghijk",languageHint:"my",variant,segments,
});
const get=(files)=>async path=>{
 const name=path.split("/").at(-1);
 if(!Object.hasOwn(files,name))throw Error("Missing fixture");
 return files[name];
};
const options=(files)=>({readJson:get(files),match:suggestAutoSyncFromTranscript,evaluate:evaluateAutoSyncDataset});

test("uses original and isolated vocals as distinct paired evaluation conditions",async()=>{
 const files={"reference.json":reference,"source.json":trans("source"),"vocals.json":trans("vocals")};
 const result=await evaluateTranscriptionBatch({version:1,recordings:[{reference:"reference.json",source:"source.json",vocals:"vocals.json"}]},
  "/tmp/manifest.json",options(files));
 assert.equal(result.summary.pairedSongs,1);
 assert.equal(result.summary.source.predictedLines,2);
 assert.equal(result.summary.vocals.predictedLines,2);
 assert.equal(result.summary.pairedSource.bothWithin1s,1);
 assert.equal(result.summary.decision,"insufficient_evidence");
 assert.equal(result.perSong[0].variants.vocals.matchedLines,2);
});
test("missing variant remains unpaired and cannot claim five-song readiness",async()=>{
 const result=await evaluateTranscriptionBatch({version:1,recordings:[{reference:"reference.json",source:"source.json"}]},
 "/tmp/manifest.json",options({"reference.json":reference,"source.json":trans("source")}));
 assert.equal(result.summary.pairedSongs,0);
 assert.equal(result.summary.vocals.evaluatedSongs,0);
});
test("rejects wrong YouTube video, mislabeled variants and duplicate samples",async()=>{
 const files={"reference.json":reference,"source.json":trans("source"),"vocals.json":trans("vocals")};
 const manifest={version:1,recordings:[{reference:"reference.json",source:"source.json",vocals:"vocals.json"}]};
 await assert.rejects(evaluateTranscriptionBatch(manifest,"/tmp/manifest.json",options({...files,"source.json":{...trans("source"),youtubeVideoId:"123456789ab"}})),/different YouTube/);
 await assert.rejects(evaluateTranscriptionBatch(manifest,"/tmp/manifest.json",options({...files,"source.json":trans("vocals")})),/not labeled as source/);
 await assert.rejects(evaluateTranscriptionBatch({...manifest,recordings:[...manifest.recordings,...manifest.recordings]},
  "/tmp/manifest.json",options(files)),/Duplicate/);
});
test("rejects stale references and unsupported paths before reporting results",async()=>{
 const stale={...reference,reference:{...reference.reference,lyricsFingerprint:"a".repeat(64)}};
 await assert.rejects(evaluateTranscriptionBatch({version:1,recordings:[{reference:"reference.json",source:"source.json"}]},
  "/tmp/manifest.json",options({"reference.json":stale,"source.json":trans("source")})),/LyricsV2/);
 await assert.rejects(evaluateTranscriptionBatch({version:1,recordings:[{reference:"https://example.com/a",source:"source.json"}]},
  "/tmp/manifest.json",options({})),/local JSON/);
 await assert.rejects(evaluateTranscriptionBatch({version:1,recordings:[]},"/tmp/manifest.json",options({})),/1–100/);
});
test("never overwrites existing report",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"romanizedmm-sync-eval-"));
 try{
  const path=join(dir,"report.json");
  await saveTranscriptionBatch({version:1,summary:{decision:"insufficient_evidence"},perSong:[]},path);
  assert.equal(JSON.parse(await readFile(path,"utf8")).version,1);
  await assert.rejects(saveTranscriptionBatch({version:1},path),/EEXIST/);
 }finally{await rm(dir,{force:true,recursive:true});}
});
