import {z} from "zod";

/**
 * This is a durable *job* contract only. Audio never belongs in MongoDB.
 * Object keys are assigned by a trusted upload service in a later phase.
 */
const videoId=z.string().regex(/^[a-zA-Z0-9_-]{11}$/);
const fingerprint=z.string().regex(/^[a-f0-9]{64}$/);
const storageKey=z.string().min(1).max(256).regex(/^auto-sync\/[a-zA-Z0-9/_-]+\.[a-z0-9]+$/);
const isoDate=z.date();
const jobStatus=z.enum(["awaiting_upload","queued","processing","completed","failed","cancelled"]);
export const AutoSyncJobSchema=z.object({
  version:z.literal(1),
  mmid:z.number().int().positive(),
  youtubeVideoId:videoId,
  lyricsFingerprint:fingerprint,
  status:jobStatus,
  uploadKey:storageKey.nullable(),
  errorCode:z.enum(["worker_error","expired_upload","invalid_audio","stale_lyrics","cancelled"]).nullable(),
  createdAt:isoDate,
  updatedAt:isoDate,
  expiresAt:isoDate,
}).strict();
export type AutoSyncJob=z.infer<typeof AutoSyncJobSchema>;
export type AutoSyncJobStatus=AutoSyncJob["status"];

export const AUTO_SYNC_MAX_BYTES=100*1024*1024;
export const AUTO_SYNC_UPLOAD_TTL_MS=30*60*1000;
export const AUTO_SYNC_JOB_TTL_MS=7*24*60*60*1000;
export const AUTO_SYNC_ALLOWED_AUDIO_TYPES=["audio/mpeg","audio/wav","audio/x-wav","audio/mp4","audio/aac","audio/flac"] as const;
export function validateAutoSyncAudioMetadata(metadata:{bytes:number;contentType:string}) {
  if(!Number.isSafeInteger(metadata.bytes)||metadata.bytes<1||metadata.bytes>AUTO_SYNC_MAX_BYTES)
    throw new Error("Audio must be nonempty and at most 100 MiB");
  if(!AUTO_SYNC_ALLOWED_AUDIO_TYPES.some(type=>type===metadata.contentType))
    throw new Error("Unsupported audio MIME type");
}
export function createAwaitingUploadJob(args:{
  mmid:number;youtubeVideoId:string;lyricsFingerprint:string;
},now=new Date()):AutoSyncJob {
  return AutoSyncJobSchema.parse({
    version:1,...args,status:"awaiting_upload",uploadKey:null,errorCode:null,
    createdAt:now,updatedAt:now,expiresAt:new Date(now.getTime()+AUTO_SYNC_JOB_TTL_MS),
  });
}
export function canTransitionAutoSyncJob(from:AutoSyncJobStatus,to:AutoSyncJobStatus):boolean {
  const legal:Record<AutoSyncJobStatus,AutoSyncJobStatus[]>={
    awaiting_upload:["queued","cancelled","failed"],
    queued:["processing","cancelled","failed"],
    processing:["completed","failed"],
    completed:[],failed:[],cancelled:[],
  };
  return legal[from]?.includes(to)??false;
}
/** Protect workers/admin from overwriting completed or stale jobs. */
export function transitionAutoSyncJob(
  current:AutoSyncJob,to:AutoSyncJobStatus,at:Date,
  options:{uploadKey?:string;errorCode?:AutoSyncJob["errorCode"]}={},
):AutoSyncJob {
  const existing=AutoSyncJobSchema.parse(current);
  if(!canTransitionAutoSyncJob(existing.status,to))throw new Error("Invalid auto-sync job transition");
  if(!(at instanceof Date)||!Number.isFinite(at.getTime())||at.getTime()<existing.updatedAt.getTime())
    throw new Error("Invalid job transition time");
  if(at.getTime()>=existing.expiresAt.getTime())throw new Error("Auto-sync job has expired");
  const uploadKey=to==="queued"?options.uploadKey:existing.uploadKey;
  if(to==="queued"&&!uploadKey)throw new Error("Queueing requires an authorized upload key");
  if(to!=="queued"&&options.uploadKey!==undefined)throw new Error("Upload key can only be set when queued");
  if(to==="completed"&&!uploadKey)throw new Error("Completed job is missing audio");
  const errorCode=to==="failed"?(options.errorCode??"worker_error"):
    to==="cancelled"?"cancelled":null;
  return AutoSyncJobSchema.parse({...existing,status:to,uploadKey,
    errorCode,updatedAt:at});
}
export function assertAutoSyncJobCurrent(job:AutoSyncJob,context:{
  mmid:number;youtubeVideoId:string;lyricsFingerprint:string;
}) {
  if(job.mmid!==context.mmid||job.youtubeVideoId!==context.youtubeVideoId)
    throw new Error("Job belongs to another song or recording");
  if(job.lyricsFingerprint!==context.lyricsFingerprint)
    throw new Error("Song lyrics changed; this job is stale");
}
