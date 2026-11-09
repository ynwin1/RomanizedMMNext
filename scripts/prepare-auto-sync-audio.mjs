#!/usr/bin/env node
import {prepareAutoSyncAudio} from "./auto-sync-audio-core.mjs";

function usage() {
  return "Usage: npm run prepare:auto-sync-audio -- --input <authorized-local-file> --video-id <11-char-id> [--out-dir .auto-sync-work]";
}
const argv=process.argv.slice(2);
if(argv.includes("--help")) {
  process.stdout.write(usage()+"\n");
} else {
  try {
    const accepted=new Set(["--input","--video-id","--out-dir"]);
    const args={};
    for(let i=0;i<argv.length;i+=2) {
      const key=argv[i];
      if(!accepted.has(key)||args[key]!==undefined||!argv[i+1]||argv[i+1].startsWith("--"))throw new Error(usage());
      args[key]=argv[i+1];
    }
    if(!args["--input"]||!args["--video-id"])throw new Error(usage());
    const result=await prepareAutoSyncAudio({
      inputPath:args["--input"],videoId:args["--video-id"],
      outputDir:args["--out-dir"]??".auto-sync-work",
    });
    process.stdout.write(JSON.stringify({audioPath:result.audioPath,manifestPath:result.manifestPath,manifest:result.manifest},null,2)+"\n");
  }catch(error) {
    process.stderr.write((error instanceof Error?error.message:String(error))+"\n");
    process.exitCode=1;
  }
}
