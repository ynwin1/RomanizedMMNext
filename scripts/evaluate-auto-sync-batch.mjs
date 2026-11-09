import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createRequire} from "node:module";
import {evaluateTranscriptionBatch,saveTranscriptionBatch} from "./auto-sync-evaluation-runner.mjs";
const require=createRequire(import.meta.url);
const {suggestAutoSyncFromTranscript}=require("../.test-dist/modules/songs/application/auto-sync.match.js");
const {evaluateAutoSyncDataset}=require("../.test-dist/modules/songs/application/auto-sync.dataset.js");

const usage="Usage: npm run evaluate:auto-sync-batch -- --manifest .auto-sync-work/evaluation-input.json [--out .auto-sync-work/evaluation-results.json]";
const argv=process.argv.slice(2);
if(argv.includes("--help"))process.stdout.write(usage+"\n");
else try{
  if(argv.length%2)throw Error(usage);
  const values={};
  for(let i=0;i<argv.length;i+=2){
    if(!["--manifest","--out"].includes(argv[i])||values[argv[i]]!==undefined||
      !argv[i+1]||argv[i+1].startsWith("--"))throw Error(usage);
    values[argv[i]]=argv[i+1];
  }
  if(!values["--manifest"])throw Error(usage);
  const input=resolve(values["--manifest"]);
  const manifest=JSON.parse(await readFile(input,"utf8"));
  const result=await evaluateTranscriptionBatch(manifest,input,{
    match:suggestAutoSyncFromTranscript,evaluate:evaluateAutoSyncDataset,
  });
  const output=await saveTranscriptionBatch(result,values["--out"]??".auto-sync-work/evaluation-results.json");
  process.stdout.write(JSON.stringify({
    output,numberOfSongs:result.summary.numberOfSongs,
    pairedSongs:result.summary.pairedSongs,decision:result.summary.decision,
    pairedSource:result.summary.pairedSource,pairedVocals:result.summary.pairedVocals,
    notes:result.summary.notes,
  },null,2)+"\n");
}catch(error){
  process.stderr.write((error instanceof Error?error.message:String(error))+"\n");
  process.exitCode=1;
}
