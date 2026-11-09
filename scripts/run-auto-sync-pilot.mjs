import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createRequire} from "node:module";
import {runAutoSyncPilot} from "./auto-sync-pilot-core.mjs";
const require=createRequire(import.meta.url);
const {suggestAutoSyncFromTranscript}=require("../.test-dist/modules/songs/application/auto-sync.match.js");
const {evaluateAutoSyncDataset}=require("../.test-dist/modules/songs/application/auto-sync.dataset.js");

const usage="Usage: npm run pilot:auto-sync -- --manifest .auto-sync-work/pilot-input.json";
const args=process.argv.slice(2);
if(args.includes("--help"))process.stdout.write(usage+"\n");
else try{
  if(args.length!==2||args[0]!=="--manifest")throw Error(usage);
  const filename=resolve(args[1]);
  const manifest=JSON.parse(await readFile(filename,"utf8"));
  const result=await runAutoSyncPilot(manifest,filename,{
    match:suggestAutoSyncFromTranscript,evaluate:evaluateAutoSyncDataset,
  });
  process.stdout.write(JSON.stringify({
    report:result.output,numberOfSongs:result.numberOfSongs,
    pairedSongs:result.pairedSongs,decision:result.decision,
    source:result.metrics.source,vocals:result.metrics.vocals,
  },null,2)+"\n");
}catch(error){
  process.stderr.write((error instanceof Error?error.message:String(error))+"\n");
  process.exitCode=1;
}
