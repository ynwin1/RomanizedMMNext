import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {resolve,join,basename} from "node:path";
import {stat,mkdir,readFile,writeFile} from "node:fs/promises";

const execute=promisify(execFile);
const VIDEO_ID=/^[a-zA-Z0-9_-]{11}$/;
const MAX_BYTES=200*1024*1024;
const MODELS=new Set(["small","medium","large-v3"]);
const VARIANTS=new Set(["source","vocals"]);
const DEVICES=new Set(["cpu","cuda"]);
function localPath(input){
  if(typeof input!=="string"||!input.trim()||/^[a-z][a-z\d+.-]*:\/\//i.test(input))throw Error("Expected a local audio file path, not a URL");
  return resolve(input);
}
export function validateTranscript(input){
  if(!input||input.version!==1||input.languageHint!=="my"||typeof input.detectedLanguage!=="string"
    ||!MODELS.has(input.model)||!Array.isArray(input.segments)||input.segments.length>5000)throw Error("Malformed transcription result");
  let lastStart=-1;
  const segments=input.segments.map(segment=>{
    const {startMs,endMs,text}=segment??{};
    if(!Number.isSafeInteger(startMs)||!Number.isSafeInteger(endMs)||startMs<0||endMs<=startMs||endMs>86_400_000
      ||typeof text!=="string"||text.length>2000||startMs<lastStart)throw Error("Invalid transcription segment");
    lastStart=startMs;
    return {startMs,endMs,text};
  });
  return {version:1,languageHint:"my",detectedLanguage:input.detectedLanguage,model:input.model,segments};
}
export function transcriptDiagnostics(segments){
  const text=segments.map(s=>s.text).join(" ");
  const visible=[...text].filter(char=>!(/\s/u.test(char)));
  const burmeseChars=visible.filter(char=>/[\u1000-\u109F\uAA60-\uAA7F]/u.test(char)).length;
  return {segmentCount:segments.length,nonWhitespaceCharacters:visible.length,
    burmeseScriptRatio:visible.length?burmeseChars/visible.length:0,
    note:"Diagnostic only: script ratio and timestamps do not measure transcription or synchronization accuracy."};
}
export async function runBurmeseTranscription({inputPath,videoId,variant="source",model="medium",device="cpu",outputDir=".auto-sync-work/transcripts"},{run}={}){
  const input=localPath(inputPath);
  if(!VIDEO_ID.test(videoId??""))throw Error("Invalid YouTube video ID");
  if(!VARIANTS.has(variant)||!MODELS.has(model)||!DEVICES.has(device))throw Error("Unsupported experiment option");
  if(typeof outputDir!=="string"||!outputDir.trim())throw Error("Output directory is required");
  const info=await stat(input);
  if(!info.isFile()||info.size===0||info.size>MAX_BYTES)throw Error("Expected non-empty local audio under 200 MiB");
  const invoke=run??((binary,args)=>execute(binary,args,{timeout:900_000,maxBuffer:4*1024*1024,windowsHide:true}));
  const script=resolve("scripts/transcribe-burmese-audio.py");
  const {stdout}=await invoke("python",[script,"--input",input,"--model",model,"--device",device]);
  let json;
  try{json=JSON.parse(stdout);}catch{throw Error("Transcription worker returned invalid JSON");}
  const validated=validateTranscript(json);
  if(validated.model!==model)throw Error("Transcription model mismatch");
  const destination=resolve(outputDir);
  await mkdir(destination,{recursive:true,mode:0o700});
  const file=join(destination,`${videoId}.${variant}.${model}.json`);
  const result={...validated,youtubeVideoId:videoId,variant,sourceFile:basename(input),
    diagnostics:transcriptDiagnostics(validated.segments)};
  await writeFile(file,JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
  return {path:file,report:result};
}
