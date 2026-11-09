#!/usr/bin/env node
import {runBurmeseTranscription} from "./auto-sync-transcription-core.mjs";
const usage="Usage: npm run transcribe:auto-sync -- --input <authorized-local-audio> --video-id <11-character-id> [--variant source|vocals] [--model small|medium|large-v3] [--device cpu|cuda] [--out-dir .auto-sync-work/transcripts]";
if(process.argv.includes("--help")){
  process.stdout.write(usage+"\n");
}else{
  try{
    const allowed=new Set(["--input","--video-id","--variant","--model","--device","--out-dir"]);
    const args={};const argv=process.argv.slice(2);
    if(argv.length%2)throw Error(usage);
    for(let i=0;i<argv.length;i+=2){
      if(!allowed.has(argv[i])||args[argv[i]]!==undefined||!argv[i+1]||argv[i+1].startsWith("--"))throw Error(usage);
      args[argv[i]]=argv[i+1];
    }
    if(!args["--input"]||!args["--video-id"])throw Error(usage);
    const result=await runBurmeseTranscription({
      inputPath:args["--input"],videoId:args["--video-id"],
      variant:args["--variant"],model:args["--model"],
      device:args["--device"],outputDir:args["--out-dir"],
    });
    process.stdout.write(JSON.stringify({path:result.path,diagnostics:result.report.diagnostics},null,2)+"\n");
  }catch(error){
    process.stderr.write((error instanceof Error?error.message:String(error))+"\n");
    process.exitCode=1;
  }
}
