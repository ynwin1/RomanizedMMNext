import {createHmac,createHash} from "node:crypto";
import {
  AUTO_SYNC_MAX_BYTES,AUTO_SYNC_UPLOAD_TTL_MS,
  validateAutoSyncAudioMetadata,
} from "../application/auto-sync.job";

const MAX_GRANT_SECONDS=Math.min(900,Math.floor(AUTO_SYNC_UPLOAD_TTL_MS/1000));
const ID=/^[a-f0-9]{24}$/i;
const KEY=/^auto-sync\/[0-9]+\/[a-f0-9]{24}\/audio\.(mp3|wav|m4a|aac|flac)$/;
const EXTENSION:Record<string,string>={
  "audio/mpeg":"mp3","audio/wav":"wav","audio/x-wav":"wav",
  "audio/mp4":"m4a","audio/aac":"aac","audio/flac":"flac",
};
export interface PrivateAudioConfig {
  endpoint:string;
  bucket:string;
  region:string;
  accessKeyId:string;
  secretAccessKey:string;
}
function ensureConfig(config:PrivateAudioConfig) {
  if(typeof config.endpoint!=="string"||!config.endpoint.trim())throw new Error("Private audio endpoint is required");
  const url=new URL(config.endpoint);
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||
    url.pathname!=="/"||!url.hostname||url.port)throw new Error("Private audio endpoint must be an HTTPS origin");
  if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(config.bucket)||config.bucket.includes(".."))
    throw new Error("Invalid private storage bucket");
  if(!/^[a-zA-Z0-9-]{2,32}$/.test(config.region))throw new Error("Invalid storage region");
  if(!config.accessKeyId||!config.secretAccessKey)throw new Error("Private audio storage credentials are required");
  return url;
}
export function loadPrivateAudioConfig(env:Record<string,string|undefined>=process.env):PrivateAudioConfig {
  const config={
    endpoint:env.AUTO_SYNC_S3_ENDPOINT??"",
    bucket:env.AUTO_SYNC_S3_BUCKET??"",
    region:env.AUTO_SYNC_S3_REGION??"",
    accessKeyId:env.AUTO_SYNC_S3_ACCESS_KEY_ID??"",
    secretAccessKey:env.AUTO_SYNC_S3_SECRET_ACCESS_KEY??"",
  };
  ensureConfig(config);
  return config;
}
export function privateAudioObjectKey(mmid:number,jobId:string,contentType:string) {
  if(!Number.isSafeInteger(mmid)||mmid<=0||!ID.test(jobId))
    throw new Error("Invalid job identity for audio upload");
  if(!Object.hasOwn(EXTENSION,contentType))throw new Error("Unsupported audio MIME type");
  return `auto-sync/${mmid}/${jobId.toLowerCase()}/audio.${EXTENSION[contentType]}`;
}
function escaped(value:string){return encodeURIComponent(value).replace(/[!'()*]/g,ch=>"%"+ch.charCodeAt(0).toString(16).toUpperCase());}
function hash(value:string){return createHash("sha256").update(value).digest("hex");}
function hmac(key:Buffer|string,value:string){return createHmac("sha256",key).update(value).digest();}
function signingKey(secret:string,date:string,region:string) {
  const kDate=hmac("AWS4"+secret,date);
  const kRegion=hmac(kDate,region);
  const kService=hmac(kRegion,"s3");
  return hmac(kService,"aws4_request");
}
function dateParts(at:Date) {
  if(!Number.isFinite(at.getTime()))throw new Error("Invalid signing time");
  const stamp=at.toISOString().replace(/[:-]|\.\d{3}/g,"");
  return {date:stamp.slice(0,8),timestamp:stamp};
}
function canonicalQuery(values:Record<string,string>){
  return Object.keys(values).sort().map(k=>`${escaped(k)}=${escaped(values[k])}`).join("&");
}
function buildSignedUrl(config:PrivateAudioConfig,method:"PUT"|"HEAD",key:string,
  headers:Record<string,string>,at:Date,ttlSeconds:number){
  const origin=ensureConfig(config);
  if(!KEY.test(key))throw new Error("Invalid audio object key");
  if(!Number.isInteger(ttlSeconds)||ttlSeconds<1||ttlSeconds>MAX_GRANT_SECONDS)
    throw new Error("Invalid signed URL lifetime");
  const {date,timestamp}=dateParts(at);
  const path="/"+escaped(config.bucket)+"/"+key.split("/").map(escaped).join("/");
  const headerMap:Record<string,string>={host:origin.host,...headers};
  const keys=Object.keys(headerMap).sort();
  const signedHeaders=keys.join(";");
  const credential=`${config.accessKeyId}/${date}/${config.region}/s3/aws4_request`;
  const params={
    "X-Amz-Algorithm":"AWS4-HMAC-SHA256",
    "X-Amz-Credential":credential,
    "X-Amz-Date":timestamp,
    "X-Amz-Expires":String(ttlSeconds),
    "X-Amz-SignedHeaders":signedHeaders,
  };
  const canonicalHeaders=keys.map(k=>`${k}:${headerMap[k].trim().replace(/\s+/g," ")}\n`).join("");
  // Query authentication for S3 uses UNSIGNED-PAYLOAD. Use a single-use
  // key and recheck size/type and actual signature on the storage provider.
  const request=[method,path,canonicalQuery(params),canonicalHeaders,signedHeaders,"UNSIGNED-PAYLOAD"].join("\n");
  const scope=`${date}/${config.region}/s3/aws4_request`;
  const toSign=["AWS4-HMAC-SHA256",timestamp,scope,hash(request)].join("\n");
  const signature=createHmac("sha256",signingKey(config.secretAccessKey,date,config.region)).update(toSign).digest("hex");
  return origin.origin+path+"?"+canonicalQuery({...params,"X-Amz-Signature":signature});
}
export interface UploadGrant {
  method:"PUT";
  url:string;
  key:string;
  headers:{"content-type":string;"content-length":string};
  expiresAt:string;
}
export function createPrivateAudioUploadGrant(config:PrivateAudioConfig,params:{
  mmid:number;jobId:string;bytes:number;contentType:string;
},at=new Date()):UploadGrant {
  validateAutoSyncAudioMetadata({bytes:params.bytes,contentType:params.contentType});
  const key=privateAudioObjectKey(params.mmid,params.jobId,params.contentType);
  const headers={"content-type":params.contentType,"content-length":String(params.bytes)};
  return {
    method:"PUT",key,headers,
    url:buildSignedUrl(config,"PUT",key,headers,at,MAX_GRANT_SECONDS),
    expiresAt:new Date(at.getTime()+MAX_GRANT_SECONDS*1000).toISOString(),
  };
}
export async function verifyPrivateAudioObject(config:PrivateAudioConfig,params:{
  mmid:number;jobId:string;key:string;bytes:number;contentType:string;
},{
  fetcher=fetch,at=new Date(),
}:{
  fetcher?:typeof fetch;at?:Date;
}={}):Promise<void> {
  validateAutoSyncAudioMetadata({bytes:params.bytes,contentType:params.contentType});
  if(privateAudioObjectKey(params.mmid,params.jobId,params.contentType)!==params.key)
    throw new Error("Stored audio key does not belong to the expected job");
  const url=buildSignedUrl(config,"HEAD",params.key,{},at,60);
  const response=await fetcher(url,{method:"HEAD",redirect:"error",signal:AbortSignal.timeout(10_000)});
  if(!response.ok)throw new Error("Private audio upload is missing or not accessible");
  const storedBytes=Number(response.headers.get("content-length"));
  const storedType=response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if(!Number.isSafeInteger(storedBytes)||storedBytes!==params.bytes||storedBytes>AUTO_SYNC_MAX_BYTES||
    storedType!==params.contentType)
    throw new Error("Private audio metadata does not match the upload authorization");
}
