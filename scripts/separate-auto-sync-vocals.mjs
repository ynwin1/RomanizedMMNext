#!/usr/bin/env node
import {separateAutoSyncVocals} from "./auto-sync-vocals-core.mjs";

const usage="Usage: npm run separate:auto-sync-vocals -- --input <authorized-local-audio> --video-id <11-character-id> [--out-dir .auto-sync-work/vocals]";
if(process.argv.includes("--help")){
  process.stdout.write(usage+"\n");
}else{
  try{
    const allowed=new Set(["--input","--video-id","--out-dir"]);
    const argv=process.argv.slice(2);
    const values={};
    for(let i=0;i<argv.length;i+=2){
      const key=argv[i];
      if(!allowed.has(key)||values[key]!==undefined||!argv[i+1]||argv[i+1].startsWith("--"))throw new Error(usage);
      values[key]=argv[i+1];
    }
    if(!values["--input"]||!values["--video-id"])throw new Error(usage);
    const result=await separateAutoSyncVocals({
      inputPath:values["--input"],
      videoId:values["--video-id"],
      outputDir:values["--out-dir"]??".auto-sync-work/vocals",
    });
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
  }catch(error){
    process.stderr.write((error instanceof Error?error.message:String(error))+"\n");
    process.exitCode=1;
  }
}
