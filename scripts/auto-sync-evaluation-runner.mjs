import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,dirname} from "node:path";

/**
 * Read-only orchestration of the already tested matcher and dataset benchmark.
 * No inference, network access, YouTube download, or database operations.
 */
export async function evaluateTranscriptionBatch(manifest,manifestFile,{
  readJson=async path=>JSON.parse(await readFile(path,"utf8")),
  match,
  evaluate,
}){
  if(manifest?.version!==1||!Array.isArray(manifest.recordings)||
    manifest.recordings.length<1||manifest.recordings.length>100)
    throw Error("Expected version 1 manifest with 1–100 recordings");
  const folder=dirname(resolve(manifestFile));
  const open=async relative=>{
    if(typeof relative!=="string"||!relative.trim()||
      /^[a-z][a-z\d+.-]*:\/\//i.test(relative))
      throw Error("Provide a local JSON filename, not a URL");
    return readJson(resolve(folder,relative));
  };
  const samples=[];
  const perSong=[];
  const unique=new Set();
  for(const item of manifest.recordings){
    if(!item||typeof item.reference!=="string")throw Error("Recording must have a reference path");
    if(typeof item.source!=="string"&&typeof item.vocals!=="string")
      throw Error("Recording needs at least one transcript path");
    const reference=await open(item.reference);
    if(reference?.version!==1||!Number.isSafeInteger(reference.mmid)||
      reference.mmid<=0||!reference.lyrics||!reference.reference)
      throw Error("Invalid P18.1.2 reference export");
    const id=reference.reference.youtubeVideoId;
    const uniqueKey=`${reference.mmid}:${id}`;
    if(unique.has(uniqueKey))throw Error("Duplicate song/recording in evaluation manifest");
    unique.add(uniqueKey);
    const sample={
      mmid:reference.mmid,lyrics:reference.lyrics,reference:reference.reference,
      manualMinutes:item.manualMinutes,assistedMinutes:item.assistedMinutes,
    };
    const result={mmid:reference.mmid,youtubeVideoId:id,variants:{}};
    for(const variant of ["source","vocals"]){
      if(typeof item[variant]!=="string")continue;
      const transcript=await open(item[variant]);
      if(transcript?.youtubeVideoId!==id)throw Error("Transcription and reference use different YouTube recordings");
      if(transcript.variant!==variant)throw Error(`Transcription is not labeled as ${variant}`);
      const report=match(reference.lyrics,transcript);
      if(report?.suggestion?.youtubeVideoId!==id||
        report.suggestion.lyricsFingerprint!==reference.reference.lyricsFingerprint)
        throw Error("Matching output does not match the reference recording and LyricsV2");
      sample[variant]=report.suggestion;
      result.variants[variant]={matchedLines:report.matchedLines,totalLyricLines:report.totalLyricLines,
        warnings:report.warnings};
    }
    samples.push(sample);
    perSong.push(result);
  }
  // Any stale fingerprint, wrong line index or invalid timestamp is rejected by
  // evaluate() before the caller writes a final report.
  const summary=evaluate(samples);
  return {version:1,summary,perSong};
}

export async function saveTranscriptionBatch(report,outputPath){
  const destination=resolve(outputPath);
  await mkdir(dirname(destination),{recursive:true,mode:0o700});
  await writeFile(destination,JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600});
  return destination;
}
