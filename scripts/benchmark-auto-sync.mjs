import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,dirname,join} from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {evaluateAutoSyncDataset}=require("../.test-dist/modules/songs/application/auto-sync.dataset.js");

const usage="Usage: npm run benchmark:auto-sync -- --manifest .auto-sync-work/benchmark-manifest.json [--out .auto-sync-work/benchmark-report.json]";
const options={};const argv=process.argv.slice(2);
if(argv.includes("--help"))process.stdout.write(usage+"\n");
else try{
  if(argv.length%2)throw Error(usage);
  for(let i=0;i<argv.length;i+=2){
    if(!["--manifest","--out"].includes(argv[i])||options[argv[i]]!==undefined||
      !argv[i+1]||argv[i+1].startsWith("--"))throw Error(usage);
    options[argv[i]]=argv[i+1];
  }
  if(!options["--manifest"])throw Error(usage);
  const filename=resolve(options["--manifest"]);
  const manifest=JSON.parse(await readFile(filename,"utf8"));
  if(manifest?.version!==1||!Array.isArray(manifest.samples)||manifest.samples.length===0||manifest.samples.length>100)
    throw Error("Expected a version 1 benchmark manifest with 1–100 samples");
  const fromManifest=async value=>{
    if(typeof value!=="string"||!value.trim()||/^[a-z][a-z\d+.-]*:\/\//i.test(value))throw Error("Expected local JSON filename");
    return JSON.parse(await readFile(resolve(dirname(filename),value),"utf8"));
  };
  const data=[];
  for(const item of manifest.samples){
    if(typeof item?.reference!=="string")throw Error("Reference export path missing");
    if(typeof item.source!=="string"&&typeof item.vocals!=="string")throw Error("At least one matching variant is required");
    const exported=await fromManifest(item.reference);
    if(exported?.version!==1||!exported.lyrics||!exported.reference)throw Error("Expected P18.1.2 reference export");
    const unwrap=async value=>{
      if(!value)return undefined;
      const data=await fromManifest(value);
      if(!data?.suggestion)throw Error("Expected P18.3.2 match report containing suggestion");
      return data.suggestion;
    };
    data.push({
      mmid:exported.mmid,lyrics:exported.lyrics,reference:exported.reference,
      source:await unwrap(item.source),vocals:await unwrap(item.vocals),
      manualMinutes:item.manualMinutes,assistedMinutes:item.assistedMinutes,
    });
  }
  const result=evaluateAutoSyncDataset(data);
  const output=resolve(options["--out"]??".auto-sync-work/benchmark-report.json");
  await mkdir(dirname(output),{recursive:true,mode:0o700});
  await writeFile(output,JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
  process.stdout.write(JSON.stringify({output,decision:result.decision,numberOfSongs:result.numberOfSongs,
    pairedSongs:result.pairedSongs,pairedSource:result.pairedSource,pairedVocals:result.pairedVocals,
    editingTime:result.editingTime},null,2)+"\n");
}catch(error){
  process.stderr.write((error instanceof Error?error.message:String(error))+"\n");
  process.exitCode=1;
}
