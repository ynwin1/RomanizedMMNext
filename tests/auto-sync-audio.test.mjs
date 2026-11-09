import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,readFile,stat,rm,readdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {parseAudioProbe,prepareAutoSyncAudio} from "../scripts/auto-sync-audio-core.mjs";

const validProbe=JSON.stringify({format:{duration:"180.257"},streams:[{codec_type:"video"},{codec_type:"audio"}]});
test("probe requires valid, bounded duration and an audio stream",()=>{
  assert.deepEqual(parseAudioProbe(validProbe),{durationMs:180257});
  assert.throws(()=>parseAudioProbe("not json"),/valid JSON/);
  assert.throws(()=>parseAudioProbe(JSON.stringify({format:{duration:"5"},streams:[{codec_type:"video"}]})),/audio stream/);
  assert.throws(()=>parseAudioProbe(JSON.stringify({format:{duration:"901"},streams:[{codec_type:"audio"}]})),/duration/);
  assert.throws(()=>parseAudioProbe(JSON.stringify({format:{duration:"unknown"},streams:[{codec_type:"audio"}]})),/duration/);
});
test("normalizes local input using safe ffmpeg arguments and writes private manifest",async()=>{
  const root=await mkdtemp(join(tmpdir(),"romanizedmm-audio-"));
  try {
    const input=join(root,"Myanmar song with spaces.mp3");
    await writeFile(input,"fixture source");
    const calls=[];
    const run=async(binary,args)=>{
      calls.push({binary,args});
      if(binary==="ffprobe")return {stdout:validProbe};
      if(binary==="ffmpeg") {
        await writeFile(args.at(-1),Buffer.alloc(100));
        return {stdout:""};
      }
      throw new Error("Unexpected binary");
    };
    const result=await prepareAutoSyncAudio({
      inputPath:input,outputDir:join(root,"output"),videoId:"abcdefghijk",
    },{run});
    assert.equal(calls.length,2);
    assert.equal(calls[0].binary,"ffprobe");
    assert.equal(calls[1].binary,"ffmpeg");
    assert.deepEqual(calls[1].args.slice(0,4),["-nostdin","-hide_banner","-loglevel","error"]);
    assert.ok(calls[1].args.includes("16000"));
    assert.ok(calls[1].args.includes("pcm_s16le"));
    assert.equal(calls[1].args[calls[1].args.indexOf("-i")+1],input);
    assert.equal(result.manifest.youtubeVideoId,"abcdefghijk");
    assert.equal(result.manifest.youtubeOffsetMs,null);
    assert.equal(result.manifest.durationMs,180257);
    assert.deepEqual(JSON.parse(await readFile(result.manifestPath,"utf8")),result.manifest);
    assert.ok((await stat(result.audioPath)).size>44);
    await assert.rejects(prepareAutoSyncAudio({inputPath:input,outputDir:join(root,"output"),videoId:"abcdefghijk"},{run}),/already exists/);
    assert.equal(calls.length,3,"rerun probes but does not transcode over existing file");
    assert.equal((await readdir(join(root,"output"))).length,2);
  }finally{await rm(root,{recursive:true,force:true});}
});
test("rejects remote URL, malformed ID, missing input and failed conversion without partial outputs",async()=>{
  const root=await mkdtemp(join(tmpdir(),"romanizedmm-audio-"));
  try{
    const input=join(root,"song.mp3");
    await writeFile(input,"fixture source");
    await assert.rejects(prepareAutoSyncAudio({inputPath:"https://youtube.com/watch?v=abcdefghijk",outputDir:root,videoId:"abcdefghijk"}),/local audio file/);
    await assert.rejects(prepareAutoSyncAudio({inputPath:input,outputDir:root,videoId:"invalid"}),/video ID/);
    await assert.rejects(prepareAutoSyncAudio({inputPath:join(root,"absent.mp3"),outputDir:root,videoId:"abcdefghijk"}),/ENOENT/);
    const outputDir=join(root,"out");
    await assert.rejects(prepareAutoSyncAudio({inputPath:input,outputDir,videoId:"abcdefghijk"},{
      run:async binary=>{
        if(binary==="ffprobe")return {stdout:validProbe};
        throw new Error("ffmpeg unavailable");
      },
    }),/ffmpeg unavailable/);
    assert.deepEqual(await readdir(outputDir),[]);
  }finally{await rm(root,{recursive:true,force:true});}
});
