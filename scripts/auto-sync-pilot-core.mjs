import {readFile,mkdir,writeFile,stat} from "node:fs/promises";
import {resolve,dirname,join} from "node:path";
import {runBurmeseTranscription} from "./auto-sync-transcription-core.mjs";
import {separateAutoSyncVocals} from "./auto-sync-vocals-core.mjs";
import {evaluateTranscriptionBatch,saveTranscriptionBatch} from "./auto-sync-evaluation-runner.mjs";

const VIDEO_ID=/^[a-zA-Z0-9_-]{11}$/;
const MODES=new Set(["source","both"]);
const MODELS=new Set(["small","medium","large-v3"]);
const DEVICES=new Set(["cpu","cuda"]);
function localPath(base,value){
  if(typeof value!=="string"||!value.trim()||/^[a-z][a-z\d+.-]*:\/\//i.test(value))
    throw Error("Expected a local file path, not a URL");
  return resolve(base,value);
}

/**
 * P18.3.5: single locally-run experiment from authorized audio and an
 * independent reference, without copying source audio or publishing timings.
 * Dependencies are injectable so CI runs without Python models or FFmpeg.
 */
export async function runAutoSyncPilot(manifest,manifestFile,{
  readJson=async path=>JSON.parse(await readFile(path,"utf8")),
  transcribe=runBurmeseTranscription,
  separate=separateAutoSyncVocals,
  evaluate,
  match,
  save=saveTranscriptionBatch,
}){
  if(manifest?.version!==1||!Array.isArray(manifest.recordings)||
    manifest.recordings.length<1||manifest.recordings.length>10)
    throw Error("Pilot requires 1–10 recording entries");
  const mode=manifest.mode??"source";
  const model=manifest.model??"medium";
  const device=manifest.device??"cpu";
  if(!MODES.has(mode)||!MODELS.has(model)||!DEVICES.has(device))
    throw Error("Invalid pilot processing options");
  const base=dirname(resolve(manifestFile));
  const jobs=[];
  const used=new Set();
  // Validate ALL inputs before running expensive audio analysis.
  for(const item of manifest.recordings){
    const reference=await readJson(localPath(base,item?.reference));
    if(reference?.version!==1||!Number.isSafeInteger(reference.mmid)||reference.mmid<=0||
      !reference.lyrics||!reference.reference||!VIDEO_ID.test(reference.reference.youtubeVideoId??""))
      throw Error("Invalid P18.1.2 benchmark reference export");
    const audioPath=localPath(base,item?.audio);
    const data=await stat(audioPath);
    if(!data.isFile()||data.size<1)throw Error("Authorized audio recording must be a nonempty local file");
    const videoId=reference.reference.youtubeVideoId;
    const key=`${reference.mmid}:${videoId}`;
    if(used.has(key))throw Error("Duplicate pilot recording");
    used.add(key);
    if((item.manualMinutes===undefined)!==(item.assistedMinutes===undefined))
      throw Error("Include both editing time measurements or neither");
    jobs.push({referencePath:localPath(base,item.reference),
      reference,videoId,audioPath,
      manualMinutes:item.manualMinutes,assistedMinutes:item.assistedMinutes});
  }
  const root=resolve(base,manifest.outputDir??"pilot-results");
  const reportEntries=[];
  const reports=new Map();
  // Each song gets a private directory, avoiding filename collisions.
  for(const job of jobs){
    const recordingDir=join(root,`${job.reference.mmid}-${job.videoId}`);
    const transcriptionDir=join(recordingDir,"transcripts");
    const entry={reference:job.referencePath};
    const source=await transcribe({inputPath:job.audioPath,videoId:job.videoId,
      variant:"source",model,device,outputDir:transcriptionDir});
    const sourcePath=resolve(source.path);
    entry.source=sourcePath;
    reports.set(sourcePath,source.report);
    if(mode==="both"){
      const isolated=await separate({inputPath:job.audioPath,videoId:job.videoId,
        outputDir:join(recordingDir,"isolated")});
      const vocal=await transcribe({inputPath:isolated.audioPath,videoId:job.videoId,
        variant:"vocals",model,device,outputDir:transcriptionDir});
      const vocalPath=resolve(vocal.path);
      entry.vocals=vocalPath;
      reports.set(vocalPath,vocal.report);
    }
    if(job.manualMinutes!==undefined){
      entry.manualMinutes=job.manualMinutes;
      entry.assistedMinutes=job.assistedMinutes;
    }
    reportEntries.push(entry);
  }
  const evalManifest={version:1,recordings:reportEntries};
  // Freshly generated transcripts need not be re-read from the disk.
  const result=await evaluateTranscriptionBatch(evalManifest,manifestFile,{
    readJson:async path=>reports.get(resolve(path))??readJson(path),
    match,evaluate,
  });
  const output=join(root,"pilot-evaluation.json");
  await save(result,output);
  return {output,numberOfSongs:result.summary.numberOfSongs,
    pairedSongs:result.summary.pairedSongs,decision:result.summary.decision,
    metrics:result.summary,transcripts:reportEntries};
}
