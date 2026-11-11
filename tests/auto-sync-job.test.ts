import test from "node:test";
import assert from "node:assert/strict";
import {
 createAwaitingUploadJob,transitionAutoSyncJob,canTransitionAutoSyncJob,
 assertAutoSyncJobCurrent,validateAutoSyncAudioMetadata,
 AUTO_SYNC_MAX_BYTES,AUTO_SYNC_JOB_TTL_MS,
} from "@/modules/songs/application/auto-sync.job";

const identity={mmid:205,youtubeVideoId:"abcdefghijk",lyricsFingerprint:"a".repeat(64)};
const now=new Date("2026-11-09T00:00:00.000Z");
const at=(m:number)=>new Date(now.getTime()+m*60_000);
test("creates a bounded pending job with no audio stored in Mongo",()=>{
 const job=createAwaitingUploadJob(identity,now);
 assert.equal(job.status,"awaiting_upload");
 assert.equal(job.uploadKey,null);
 assert.equal(job.expiresAt.getTime()-job.createdAt.getTime(),AUTO_SYNC_JOB_TTL_MS);
 assert.deepEqual(Object.keys(job).sort(),["version","mmid","youtubeVideoId","lyricsFingerprint",
 "status","uploadKey","errorCode","createdAt","updatedAt","expiresAt"].sort());
});
test("legal job transitions require an authorized upload key and disallow reopening",()=>{
 const pending=createAwaitingUploadJob(identity,now);
 assert.equal(canTransitionAutoSyncJob("awaiting_upload","completed"),false);
 assert.throws(()=>transitionAutoSyncJob(pending,"queued",at(1)),/upload key/);
 const queued=transitionAutoSyncJob(pending,"queued",at(1),{uploadKey:"auto-sync/205/approved.mp3"});
 assert.equal(queued.status,"queued");
 const active=transitionAutoSyncJob(queued,"processing",at(2));
 const finished=transitionAutoSyncJob(active,"completed",at(3));
 assert.equal(finished.status,"completed");
 assert.equal(finished.uploadKey,"auto-sync/205/approved.mp3");
 assert.throws(()=>transitionAutoSyncJob(finished,"queued",at(4)),/Invalid/);
 assert.throws(()=>transitionAutoSyncJob(pending,"completed",at(1)),/Invalid/);
});
test("cancel, fail, and expiry preserve terminal safety",()=>{
 const pending=createAwaitingUploadJob(identity,now);
 const cancelled=transitionAutoSyncJob(pending,"cancelled",at(1));
 assert.equal(cancelled.errorCode,"cancelled");
 assert.throws(()=>transitionAutoSyncJob(cancelled,"queued",at(2)),/Invalid/);
 const failed=transitionAutoSyncJob(pending,"failed",at(1),{errorCode:"expired_upload"});
 assert.equal(failed.errorCode,"expired_upload");
 assert.throws(()=>transitionAutoSyncJob(pending,"queued",new Date(now.getTime()+AUTO_SYNC_JOB_TTL_MS)),/expired/);
 assert.throws(()=>transitionAutoSyncJob(pending,"queued",at(-1)),/time/);
});
test("upload safety checks reject unsupported sizes and types",()=>{
 assert.doesNotThrow(()=>validateAutoSyncAudioMetadata({bytes:1024,contentType:"audio/mpeg"}));
 assert.throws(()=>validateAutoSyncAudioMetadata({bytes:0,contentType:"audio/mpeg"}),/Audio/);
 assert.throws(()=>validateAutoSyncAudioMetadata({bytes:AUTO_SYNC_MAX_BYTES+1,contentType:"audio/mpeg"}),/Audio/);
 assert.throws(()=>validateAutoSyncAudioMetadata({bytes:12,contentType:"text/html"}),/MIME/);
});
test("recording identity and fingerprints are required to attach job results",()=>{
 const job=createAwaitingUploadJob(identity,now);
 assert.doesNotThrow(()=>assertAutoSyncJobCurrent(job,identity));
 assert.throws(()=>assertAutoSyncJobCurrent(job,{...identity,mmid:206}),/another song/);
 assert.throws(()=>assertAutoSyncJobCurrent(job,{...identity,youtubeVideoId:"123456789ab"}),/another song/);
 assert.throws(()=>assertAutoSyncJobCurrent(job,{...identity,lyricsFingerprint:"b".repeat(64)}),/stale/);
});
