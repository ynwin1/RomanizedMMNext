import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {basename,join,resolve} from "node:path";
import {stat,mkdir,access,copyFile,rm,writeFile} from "node:fs/promises";
import {constants} from "node:fs";

const execFileAsync=promisify(execFile);
export const MAX_AUDIO_BYTES=200*1024*1024;
export const MAX_DURATION_SECONDS=15*60;
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;

/** No shell invocation, remote URLs, YouTube scraping, or persistent server uploads. */
async function runTool(binary,args) {
  return execFileAsync(binary,args,{timeout:300_000,maxBuffer:1024*1024,windowsHide:true});
}
function assertLocalFile(value) {
  if(typeof value!=="string"||!value.trim()||/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
    throw new Error("Provide a local audio file path, not a URL");
  }
}
export function parseAudioProbe(raw) {
  let data;
  try {data=JSON.parse(raw);}catch {throw new Error("ffprobe did not return valid JSON");}
  const durationSeconds=Number(data?.format?.duration);
  if(!Array.isArray(data?.streams)||!data.streams.some(s=>s.codec_type==="audio")) {
    throw new Error("Recording does not contain an audio stream");
  }
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0||durationSeconds>MAX_DURATION_SECONDS) {
    throw new Error(`Audio duration must be between 0 and ${MAX_DURATION_SECONDS} seconds`);
  }
  return {durationMs:Math.round(durationSeconds*1000)};
}
async function exists(path) {
  try {await access(path);return true;}catch(error){if(error?.code==="ENOENT")return false;throw error;}
}
/**
 * Produce private 16 kHz mono PCM WAV and a sidecar manifest for future
 * alignment experiments. The YouTube ID is an identity hint, NOT audio access.
 */
export async function prepareAutoSyncAudio({inputPath,outputDir,videoId},{run=runTool}={}) {
  assertLocalFile(inputPath);
  if(typeof outputDir!=="string"||!outputDir.trim())throw new Error("Output directory is required");
  if(!VIDEO_ID.test(videoId||""))throw new Error("Invalid YouTube video ID");
  const input=resolve(inputPath);
  const info=await stat(input);
  if(!info.isFile()||info.size===0||info.size>MAX_AUDIO_BYTES) {
    throw new Error("Input must be a non-empty local file below 200 MiB");
  }
  const probe=await run("ffprobe",[
    "-v","error","-show_entries","format=duration:stream=codec_type","-of","json",input,
  ]);
  const {durationMs}=parseAudioProbe(probe.stdout);
  const dir=resolve(outputDir);
  await mkdir(dir,{recursive:true,mode:0o700});
  const output=join(dir,`${videoId}.wav`);
  const manifestPath=join(dir,`${videoId}.json`);
  if(await exists(output)||await exists(manifestPath)) {
    throw new Error("Output already exists for this recording; choose another output directory");
  }
  const temporary=join(dir,`${videoId}.${process.pid}.${Date.now()}.tmp.wav`);
  try {
    await run("ffmpeg",[
      "-nostdin","-hide_banner","-loglevel","error",
      "-i",input,"-map","0:a:0","-vn","-ac","1","-ar","16000",
      "-c:a","pcm_s16le","-f","wav","-n",temporary,
    ]);
    const outputInfo=await stat(temporary);
    if(!outputInfo.isFile()||outputInfo.size<=44)throw new Error("Audio conversion produced no usable WAV data");
    await copyFile(temporary,output,constants.COPYFILE_EXCL);
    const manifest={
      version:1,youtubeVideoId:videoId,
      audioFile:basename(output),sourceFile:basename(input),
      sampleRateHz:16000,channels:1,format:"pcm_s16le",durationMs,
      /** The operator must verify alignment with the YouTube recording. */
      youtubeOffsetMs:null,
    };
    await writeFile(manifestPath,JSON.stringify(manifest,null,2)+"\n",{flag:"wx",mode:0o600});
    return {audioPath:output,manifestPath,manifest};
  }catch(error){
    await rm(output,{force:true});
    throw error;
  }finally {
    await rm(temporary,{force:true});
  }
}
