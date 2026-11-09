import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {createRequire} from "node:module";
import {runAutoSyncPilot} from "../scripts/auto-sync-pilot-core.mjs";

const require=createRequire(import.meta.url);
const {suggestAutoSyncFromTranscript}=require("../.test-dist/modules/songs/application/auto-sync.match.js");
const {evaluateAutoSyncDataset}=require("../.test-dist/modules/songs/application/auto-sync.dataset.js");
const {lyricTimingFingerprint}=require("../.test-dist/modules/songs/application/lyric-timing.fingerprint.js");
const lyrics={version:2,entries:[
 {kind:"line",burmese:"မင်းကိုချစ်တယ်",romanized:"min ko chit tal",meaning:null},
 {kind:"line",burmese:"အိပ်မက်တွေအားလုံး",romanized:"eik met dway a lone",meaning:null},
]};
const fp=lyricTimingFingerprint(lyrics);
const reference={version:1,mmid:205,lyrics,reference:{
 version:1,youtubeVideoId:"abcdefghijk",lyricsFingerprint:fp,lines:[
 {entryIndex:0,startMs:1000,endMs:3000},{entryIndex:1,startMs:5000,endMs:7500}],
}};
const fakeReport=(variant)=>({
 version:1,languageHint:"my",detectedLanguage:"my",model:"medium",
 youtubeVideoId:"abcdefghijk",variant,segments:[
 {startMs:1050,endMs:3100,text:"မင်းကိုချစ်တယ်"},
 {startMs:5150,endMs:7400,text:"အိပ်မက်တွေအားလုံး"}],
});
const setup=async()=>{
 const dir=await mkdtemp(join(tmpdir(),"romanizedmm-pilot-"));
 const audio=join(dir,"authorized-song.mp3");
 await writeFile(audio,"synthetic audio fixture");
 return {dir,audio};
};
test("one-command pilot produces paired benchmark from same recording",async()=>{
 const {dir,audio}=await setup();
 try{
  const calls=[];const saved=[];
  const result=await runAutoSyncPilot({
   version:1,mode:"both",recordings:[{reference:"ref.json",audio:"authorized-song.mp3"}],
  },join(dir,"pilot.json"),{
   readJson:async path=>{
    if(path===join(dir,"ref.json"))return reference;
    throw Error("Unexpected file read");
   },
   transcribe:async args=>{
    calls.push(["transcribe",args.variant,args.inputPath]);
    const path=join(dir,args.variant+".json");
    return {path,report:fakeReport(args.variant)};
   },
   separate:async args=>{
    calls.push(["separate",args.videoId,args.inputPath]);
    return {audioPath:join(dir,"vocals.wav")};
   },
   save:async(data,output)=>{saved.push(data);return output;},
   match:suggestAutoSyncFromTranscript,evaluate:evaluateAutoSyncDataset,
  });
  assert.deepEqual(calls.map(c=>c[0]),["transcribe","separate","transcribe"]);
  assert.equal(calls[0][2],audio);
  assert.equal(result.numberOfSongs,1);
  assert.equal(result.pairedSongs,1);
  assert.equal(result.metrics.pairedSource.bothWithin1s,1);
  assert.equal(result.metrics.pairedVocals.bothWithin1s,1);
  assert.equal(result.decision,"insufficient_evidence");
  assert.equal(saved.length,1);
 }finally{await rm(dir,{force:true,recursive:true});}
});
test("source-only experiment never invokes separation",async()=>{
 const {dir}=await setup();
 try{
  let separated=false;
  const result=await runAutoSyncPilot({version:1,recordings:[
   {reference:"ref.json",audio:"authorized-song.mp3"},
  ]},join(dir,"pilot.json"),{
   readJson:async()=>reference,
   separate:async()=>{separated=true;throw Error("Should not separate");},
   transcribe:async()=>({path:join(dir,"source.json"),report:fakeReport("source")}),
   save:async()=>{},match:suggestAutoSyncFromTranscript,evaluate:evaluateAutoSyncDataset,
  });
  assert.equal(separated,false);
  assert.equal(result.pairedSongs,0);
  assert.equal(result.metrics.source.predictedLines,2);
 }finally{await rm(dir,{force:true,recursive:true});}
});
test("invalid and duplicate input fails before starting model inference",async()=>{
 const {dir}=await setup();
 try{
  let runs=0;
  const deps={readJson:async()=>reference,transcribe:async()=>{runs++;throw Error("Must not run");},
   match:suggestAutoSyncFromTranscript,evaluate:evaluateAutoSyncDataset};
  const item={reference:"ref.json",audio:"authorized-song.mp3"};
  await assert.rejects(runAutoSyncPilot({version:1,recordings:[item,item]},join(dir,"pilot.json"),deps),/Duplicate/);
  await assert.rejects(runAutoSyncPilot({version:1,recordings:[{...item,audio:"https://youtube.com/video"}]},join(dir,"pilot.json"),deps),/local file/);
  await assert.rejects(runAutoSyncPilot({version:1,mode:"invalid",recordings:[item]},join(dir,"pilot.json"),deps),/Invalid pilot/);
  await assert.rejects(runAutoSyncPilot({version:1,recordings:[{...item,manualMinutes:10}]},join(dir,"pilot.json"),deps),/both editing/);
  assert.equal(runs,0);
 }finally{await rm(dir,{force:true,recursive:true});}
});
test("mismatched transcript ID cannot generate a benchmark",async()=>{
 const {dir}=await setup();
 try{
  await assert.rejects(runAutoSyncPilot({
   version:1,recordings:[{reference:"ref.json",audio:"authorized-song.mp3"}],
  },join(dir,"pilot.json"),{
   readJson:async()=>reference,
   transcribe:async()=>({path:join(dir,"bad.json"),report:{...fakeReport("source"),youtubeVideoId:"123456789ab"}}),
   save:async()=>{throw Error("Must not save");},
   match:suggestAutoSyncFromTranscript,evaluate:evaluateAutoSyncDataset,
  }),/different YouTube/);
 }finally{await rm(dir,{force:true,recursive:true});}
});
