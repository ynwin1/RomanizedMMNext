import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {basename,join,parse,resolve} from "node:path";
import {constants} from "node:fs";
import {access,copyFile,mkdir,mkdtemp,readFile,rm,stat,writeFile} from "node:fs/promises";
import {MAX_AUDIO_BYTES,MAX_DURATION_SECONDS,parseAudioProbe} from "./auto-sync-audio-core.mjs";

const runCommand=promisify(execFile);
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
async function defaultRun(command,args){
  return runCommand(command,args,{timeout:900_000,maxBuffer:1024*1024,windowsHide:true});
}
async function exists(path){
  try{await access(path);return true;}catch(error){if(error?.code==="ENOENT")return false;throw error;}
}
function assertLocalPath(value){
  if(typeof value!=="string"||!value.trim()||/^[a-z][a-z0-9+.-]*:\/\//i.test(value))throw new Error("Provide a local audio path, not a URL");
}
export function normalizeStemName(name) {
  // A separator's directory name is derived from the input file's stem.
  return parse(name).name;
}
export async function separateAutoSyncVocals(
  {inputPath,outputDir,videoId,model="htdemucs"},
  {run=defaultRun}={},
){
  assertLocalPath(inputPath);
  if(typeof outputDir!=="string"||!outputDir.trim())throw new Error("Output directory is required");
  if(!VIDEO_ID.test(videoId||""))throw new Error("Invalid YouTube video ID");
  if(model!=="htdemucs")throw new Error("Unsupported vocal separation model");
  const input=resolve(inputPath);
  const source=await stat(input);
  if(!source.isFile()||source.size===0||source.size>MAX_AUDIO_BYTES)throw new Error("Input must be a non-empty local audio file below 200 MiB");
  const checked=await run("ffprobe",["-v","error","-show_entries","format=duration:stream=codec_type","-of","json",input]);
  const {durationMs}=parseAudioProbe(checked.stdout);
  if(durationMs>MAX_DURATION_SECONDS*1000)throw new Error("Recording exceeds maximum duration");
  const output=resolve(outputDir);
  await mkdir(output,{recursive:true,mode:0o700});
  const vocalsFile=join(output,`${videoId}.vocals.wav`);
  const metadataFile=join(output,`${videoId}.vocals.json`);
  if(await exists(vocalsFile)||await exists(metadataFile))throw new Error("Vocal separation output already exists; choose another output directory");
  const working=await mkdtemp(join(output,".separation-"));
  let committed=false;
  try{
    // Demucs requires a local full-band recording; the P18.2.1 mono 16kHz
    // signal is intended for ASR, not necessarily ideal for separation.
    await run("python",["-m","demucs","--two-stems","vocals","-n",model,"-o",working,input]);
    const isolated=join(working,model,normalizeStemName(basename(input)),"vocals.wav");
    const isolatedStat=await stat(isolated);
    if(!isolatedStat.isFile()||isolatedStat.size<=44)throw new Error("Demucs did not produce usable vocals");
    const normalized=join(working,"vocals-16k.wav");
    await run("ffmpeg",["-nostdin","-hide_banner","-loglevel","error","-i",isolated,
      "-map","0:a:0","-vn","-ac","1","-ar","16000","-c:a","pcm_s16le","-f","wav","-n",normalized]);
    const result=await stat(normalized);
    if(!result.isFile()||result.size<=44)throw new Error("Vocal normalization produced an empty result");
    await copyFile(normalized,vocalsFile,constants.COPYFILE_EXCL);
    const manifest={
      version:1,youtubeVideoId:videoId,sourceFile:basename(input),audioFile:basename(vocalsFile),
      sourceDurationMs:durationMs,separator:model,
      sampleRateHz:16000,channels:1,format:"pcm_s16le",
      youtubeOffsetMs:null,
      note:"Experimental vocal isolation; compare against unseparated audio before using for synchronization.",
    };
    await writeFile(metadataFile,JSON.stringify(manifest,null,2)+"\n",{flag:"wx",mode:0o600});
    committed=true;
    return {audioPath:vocalsFile,manifestPath:metadataFile,manifest};
  }finally{
    if(!committed){
      await rm(vocalsFile,{force:true});
      await rm(metadataFile,{force:true});
    }
    await rm(working,{recursive:true,force:true});
  }
}
