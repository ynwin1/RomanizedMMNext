import test from "node:test";
import assert from "node:assert/strict";
import {
  createPrivateAudioUploadGrant,verifyPrivateAudioObject,privateAudioObjectKey,loadPrivateAudioConfig,
} from "@/modules/songs/infrastructure/auto-sync-audio.storage";
const config={
 endpoint:"https://0123456789abcdef.r2.cloudflarestorage.com",
 bucket:"romanizedmm-private-audio",region:"auto",accessKeyId:"TEST_ACCESS",secretAccessKey:"TEST_SECRET",
};
const options={mmid:205,jobId:"a".repeat(24),contentType:"audio/mpeg",bytes:12345};
const now=new Date("2026-11-10T12:00:00.000Z");
test("signs a short lived, content-type and length bound private PUT",()=>{
 const grant=createPrivateAudioUploadGrant(config,options,now);
 const url=new URL(grant.url);
 assert.equal(grant.method,"PUT");
 assert.equal(url.protocol,"https:");
 assert.equal(url.pathname,"/romanizedmm-private-audio/auto-sync/205/"+"a".repeat(24)+"/audio.mp3");
 assert.equal(url.searchParams.get("X-Amz-Expires"),"900");
 assert.equal(url.searchParams.get("X-Amz-SignedHeaders"),"content-length;content-type;host");
 assert.equal(grant.headers["content-length"],"12345");
 assert.equal(grant.key,privateAudioObjectKey(205,"a".repeat(24),"audio/mpeg"));
 assert.equal(grant.expiresAt,"2026-11-10T12:15:00.000Z");
 assert.doesNotMatch(grant.url,/TEST_SECRET/);
 assert.equal(createPrivateAudioUploadGrant(config,options,now).url,grant.url);
});
test("rejects dangerous endpoints, wrong job identity, unsupported media and invalid sizes",()=>{
 assert.throws(()=>createPrivateAudioUploadGrant({...config,endpoint:"http://127.0.0.1"},options,now),/HTTPS/);
 assert.throws(()=>createPrivateAudioUploadGrant({...config,endpoint:"https://example.com/evil"},options,now),/HTTPS origin/);
 assert.throws(()=>createPrivateAudioUploadGrant(config,{...options,jobId:"bad"},now),/job identity/);
 assert.throws(()=>createPrivateAudioUploadGrant(config,{...options,contentType:"text/html"},now),/MIME/);
 assert.throws(()=>createPrivateAudioUploadGrant(config,{...options,bytes:100*1024*1024+1},now),/Audio/);
 assert.throws(()=>loadPrivateAudioConfig({}),/endpoint/);
});
test("checks HEAD against exact byte size and MIME before queueing a job",async()=>{
 const grant=createPrivateAudioUploadGrant(config,options,now);
 let capturedMethod="";
 const fetcher=(async(_url:string,init?:RequestInit)=>{
  capturedMethod=init?.method??"";
  return new Response(null,{status:200,headers:{"content-type":"audio/mpeg","content-length":"12345"}});
 }) as typeof fetch;
 await verifyPrivateAudioObject(config,{...options,key:grant.key},{at:now,fetcher});
 assert.equal(capturedMethod,"HEAD");
 await assert.rejects(verifyPrivateAudioObject(config,{...options,key:grant.key,bytes:10},{at:now,fetcher}),/metadata/);
 await assert.rejects(verifyPrivateAudioObject(config,{...options,key:"auto-sync/205/"+"b".repeat(24)+"/audio.mp3"},{at:now,fetcher}),/belong/);
 await assert.rejects(verifyPrivateAudioObject(config,{...options,key:grant.key},{at:now,fetcher:async()=>new Response(null,{status:404})}),/missing/);
});
