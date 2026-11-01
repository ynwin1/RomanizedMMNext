import test from "node:test";
import assert from "node:assert/strict";
import {MoodometerService, type MoodometerRecord, type MoodometerStorage} from "@/modules/songs/application/moodometer.service";
import {lyricTimingFingerprint} from "@/modules/songs/application/lyric-timing.fingerprint";
import type {MoodometerAnalysis} from "@/modules/songs/domain/moodometer.types";
const lyrics={version:2 as const,entries:[{kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"love"}]};
const fingerprint=lyricTimingFingerprint(lyrics);
const draft: MoodometerAnalysis={version:1,source:"lyrics",status:"draft",lyricsFingerprint:fingerprint,modelVersion:"model",summary:"Romance",moods:[{moodId:"romantic",score:9.1},{moodId:"longing",score:7.2},{moodId:"hopeful",score:5.0}]};
function setup() {
 let records:MoodometerRecord[]=[];
 const storage:MoodometerStorage={
  async insert(mmid,analysis){const result={id:String(records.length+1),mmid,analysis:{...analysis},createdAt:new Date()};records.push(result);return result;},
  async history(mmid,limit){return records.filter(x=>x.mmid===mmid).slice().reverse().slice(0,limit);},
  async byId(mmid,id){return records.find(x=>x.mmid===mmid&&x.id===id)??null;},
  async publish(mmid,id){records=records.map(x=>x.mmid===mmid?{...x,analysis:{...x.analysis,status:x.id===id?"published":"draft"}}:x);return records.find(x=>x.mmid===mmid&&x.id===id)??null;},
  async published(mmid){return records.find(x=>x.mmid===mmid&&x.analysis.status==="published")??null;},
 };
 let current=lyrics;
 return {service:new MoodometerService(storage,async()=>current),setLyrics:(value:typeof lyrics)=>{current=value;}};
}
test("draft history is retained and only explicitly published results appear publicly",async()=>{
 const {service}=setup();
 const a=await service.saveDraft(205,draft);
 const b=await service.saveDraft(205,{...draft,summary:"A new run"});
 assert.equal((await service.history(205)).length,2);
 assert.equal(await service.publicResult(205),null);
 await service.publish(205,a.id);
 assert.equal((await service.publicResult(205))?.id,a.id);
 await service.publish(205,b.id);
 assert.equal((await service.publicResult(205))?.id,b.id);
 assert.equal((await service.history(205)).length,2);
});
test("stale analyses remain in admin history but cannot be published",async()=>{
 const {service,setLyrics}=setup();
 const saved=await service.saveDraft(205,draft);
 setLyrics({...lyrics,entries:[{...lyrics.entries[0],meaning:"changed"}]});
 assert.equal((await service.history(205)).length,1);
 await assert.rejects(()=>service.publish(205,saved.id),/stale/);
 await assert.rejects(()=>service.saveDraft(205,draft),/Lyrics changed/);
});
