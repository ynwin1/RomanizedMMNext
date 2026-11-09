import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,readdir,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {runBurmeseTranscription,validateTranscript,transcriptDiagnostics} from "../scripts/auto-sync-transcription-core.mjs";
const response={version:1,languageHint:"my",detectedLanguage:"my",model:"medium",
 segments:[{startMs:1200,endMs:3200,text:"ချစ်တယ်"},{startMs:5200,endMs:7600,text:"မင်းကို"}]};
test("recognition result parses Burmese script and retains original segment boundaries",()=>{
 assert.deepEqual(validateTranscript(response),response);
 assert.equal(transcriptDiagnostics(response.segments).segmentCount,2);
 assert.equal(transcriptDiagnostics(response.segments).burmeseScriptRatio,1);
 assert.equal(transcriptDiagnostics([]).burmeseScriptRatio,0);
});
test("rejects invalid worker segments, metadata and improper chronology",()=>{
 for(const patch of [
  {...response,languageHint:"en"},
  {...response,model:"some-unknown-model"},
  {...response,segments:[{startMs:-1,endMs:100,text:"a"}]},
  {...response,segments:[{startMs:200,endMs:100,text:"a"}]},
  {...response,segments:[response.segments[1],response.segments[0]]},
  {...response,segments:[{startMs:100,endMs:500,text:23}]},
 ])assert.throws(()=>validateTranscript(patch));
});
test("runs local Python inference and saves one private report per variant",async()=>{
 const root=await mkdtemp(join(tmpdir(),"romanizedmm-asr-"));
 try{
  const input=join(root,"original song.wav");await writeFile(input,"fake audio");
  const calls=[];
  const run=async(binary,args)=>{calls.push({binary,args});return {stdout:JSON.stringify(response)};};
  const first=await runBurmeseTranscription({inputPath:input,videoId:"abcdefghijk",outputDir:join(root,"out")},{run});
  assert.equal(calls.length,1);
  assert.equal(calls[0].binary,"python");
  assert.deepEqual(calls[0].args.slice(-6),["--input",input,"--model","medium","--device","cpu"]);
  assert.equal(first.report.variant,"source");
  assert.equal(first.report.youtubeVideoId,"abcdefghijk");
  assert.deepEqual(JSON.parse(await readFile(first.path,"utf8")),first.report);
  const second=await runBurmeseTranscription({inputPath:input,videoId:"abcdefghijk",variant:"vocals",outputDir:join(root,"out")},{run});
  assert.equal(second.report.variant,"vocals");
  assert.equal((await readdir(join(root,"out"))).length,2);
  await assert.rejects(runBurmeseTranscription({inputPath:input,videoId:"abcdefghijk",outputDir:join(root,"out")},{run}),/EEXIST/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("rejects remote audio paths, invalid config, malformed output and missing recordings",async()=>{
 const root=await mkdtemp(join(tmpdir(),"romanizedmm-asr-"));
 try{
  const audio=join(root,"source.wav");await writeFile(audio,"fake audio");
  const common={inputPath:audio,videoId:"abcdefghijk",outputDir:join(root,"out")};
  await assert.rejects(runBurmeseTranscription({...common,inputPath:"https://youtube.com/watch?v=abcdefghijk"}),/local audio/);
  await assert.rejects(runBurmeseTranscription({...common,videoId:"invalid"}),/video ID/);
  await assert.rejects(runBurmeseTranscription({...common,model:"tiny"}),/Unsupported/);
  await assert.rejects(runBurmeseTranscription({...common,inputPath:join(root,"missing.wav")}),/ENOENT/);
  await assert.rejects(runBurmeseTranscription(common,{run:async()=>({stdout:"NOT_JSON"})}),/invalid JSON/);
 }finally{await rm(root,{recursive:true,force:true});}
});
