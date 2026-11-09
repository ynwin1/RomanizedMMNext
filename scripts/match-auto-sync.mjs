import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const {suggestAutoSyncFromTranscript}=require("../.test-dist/modules/songs/application/auto-sync.match.js");
const usage="Usage: npm run match:auto-sync -- --reference <exported-reference.json> --transcript <transcription.json> [--out-dir .auto-sync-work/matches]";
const argv=process.argv.slice(2);
if(argv.includes("--help")) {
  process.stdout.write(usage+"\n");
}else{
  try{
    const options={};
    const allowed=new Set(["--reference","--transcript","--out-dir"]);
    if(argv.length%2!==0)throw Error(usage);
    for(let i=0;i<argv.length;i+=2){
      if(!allowed.has(argv[i])||options[argv[i]]!==undefined||!argv[i+1]||argv[i+1].startsWith("--"))
        throw Error(usage);
      options[argv[i]]=argv[i+1];
    }
    if(!options["--reference"]||!options["--transcript"])throw Error(usage);
    const reference=JSON.parse(await readFile(resolve(options["--reference"]),"utf8"));
    const transcript=JSON.parse(await readFile(resolve(options["--transcript"]),"utf8"));
    if(reference?.version!==1||!reference?.reference||!reference?.lyrics)throw Error("Expected P18.1.2 reference export");
    if(reference.reference.youtubeVideoId!==transcript.youtubeVideoId)
      throw Error("Reference and transcription use different YouTube recordings");
    const report=suggestAutoSyncFromTranscript(reference.lyrics,transcript);
    if(reference.reference.lyricsFingerprint!==report.suggestion.lyricsFingerprint)
      throw Error("Exported reference is stale for the current LyricsV2 snapshot");
    const directory=resolve(options["--out-dir"]??".auto-sync-work/matches");
    await mkdir(directory,{recursive:true,mode:0o700});
    const output=join(directory,`${report.suggestion.youtubeVideoId}.suggestions.json`);
    await writeFile(output,JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600});
    process.stdout.write(JSON.stringify({output,matchedLines:report.matchedLines,
      totalLyricLines:report.totalLyricLines,warnings:report.warnings},null,2)+"\n");
  }catch(error){
    process.stderr.write((error instanceof Error?error.message:String(error))+"\n");
    process.exitCode=1;
  }
}
