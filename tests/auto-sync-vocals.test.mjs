import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readdir,readFile,rm,stat,writeFile,mkdir} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {separateAutoSyncVocals,normalizeStemName} from "../scripts/auto-sync-vocals-core.mjs";

const probe=JSON.stringify({format:{duration:"185.5"},streams:[{codec_type:"audio"}]});
test("preserves ordinary source basename when looking up separated vocals",()=>{
  assert.equal(normalizeStemName("My song.mp3"),"My song");
  assert.equal(normalizeStemName("song.final.wav"),"song.final");
});
test("separates authorized input, normalizes vocals, and writes an isolated manifest",async()=>{
  const root=await mkdtemp(join(tmpdir(),"romanizedmm-vocal-test-"));
  try{
    const input=join(root,"Burmese song.mp3");
    await writeFile(input,"mock source");
    const calls=[];
    const run=async(command,args)=>{
      calls.push([command,args]);
      if(command==="ffprobe")return {stdout:probe};
      if(command==="python"){
        assert.deepEqual(args.slice(0,7),["-m","demucs","--two-stems","vocals","-n","htdemucs","-o"]);
        const source=join(args[7],"htdemucs","Burmese song");
        await mkdir(source,{recursive:true});
        await writeFile(join(source,"vocals.wav"),Buffer.alloc(100));
        return {stdout:""};
      }
      if(command==="ffmpeg"){
        await writeFile(args.at(-1),Buffer.alloc(150));
        return {stdout:""};
      }
      throw new Error("Unexpected external command");
    };
    const result=await separateAutoSyncVocals({inputPath:input,outputDir:join(root,"out"),videoId:"abcdefghijk"},{run});
    assert.deepEqual(calls.map(([name])=>name),["ffprobe","python","ffmpeg"]);
    assert.equal(result.manifest.youtubeVideoId,"abcdefghijk");
    assert.equal(result.manifest.sourceDurationMs,185500);
    assert.equal(result.manifest.youtubeOffsetMs,null);
    assert.equal(result.manifest.sampleRateHz,16000);
    assert.equal(result.manifest.separator,"htdemucs");
    assert.deepEqual(JSON.parse(await readFile(result.manifestPath,"utf8")),result.manifest);
    assert.equal((await stat(result.audioPath)).size,150);
    assert.deepEqual((await readdir(join(root,"out"))).sort(),["abcdefghijk.vocals.json","abcdefghijk.vocals.wav"]);
    await assert.rejects(separateAutoSyncVocals({inputPath:input,outputDir:join(root,"out"),videoId:"abcdefghijk"},{run}),/already exists/);
    assert.equal(calls.length,4,"existing output must not trigger another separation");
  }finally{await rm(root,{recursive:true,force:true});}
});
test("invalid source and failed separation never leave output audio or metadata",async()=>{
  const root=await mkdtemp(join(tmpdir(),"romanizedmm-vocal-test-"));
  try{
    const input=join(root,"song.wav");
    await writeFile(input,"mock source");
    const args={inputPath:input,outputDir:join(root,"output"),videoId:"abcdefghijk"};
    await assert.rejects(separateAutoSyncVocals({...args,inputPath:"https://youtube.com/watch?v=abcdefghijk"}),/local audio path/);
    await assert.rejects(separateAutoSyncVocals({...args,videoId:"bad"}),/video ID/);
    await assert.rejects(separateAutoSyncVocals({...args,model:"other"}),/Unsupported/);
    await assert.rejects(separateAutoSyncVocals(args,{run:async command=>{
      if(command==="ffprobe")return {stdout:probe};
      throw new Error("demucs unavailable");
    }}),/demucs unavailable/);
    assert.deepEqual(await readdir(args.outputDir),[]);
    await assert.rejects(separateAutoSyncVocals(args,{run:async(command,toolArgs)=>{
      if(command==="ffprobe")return {stdout:probe};
      if(command==="python"){
        const folder=join(toolArgs[7],"htdemucs","song");
        await mkdir(folder,{recursive:true});
        await writeFile(join(folder,"vocals.wav"),Buffer.alloc(100));
        return {stdout:""};
      }
      throw new Error("ffmpeg failed");
    }}),/ffmpeg failed/);
    assert.deepEqual(await readdir(args.outputDir),[]);
  }finally{await rm(root,{recursive:true,force:true});}
});
