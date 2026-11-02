import test from "node:test";
import assert from "node:assert/strict";
import {runOptionalMoodDraft} from "@/app/admin/songs/song-action-handler";

test("opt-out does not call AI or create a mood draft",async()=>{
 let called=false;
 assert.equal(await runOptionalMoodDraft(false,10,async()=>{called=true},()=>{}),undefined);
 assert.equal(called,false);
});
test("successful mood generation remains a draft pending human publication",async()=>{
 const calls:number[]=[];
 assert.equal(await runOptionalMoodDraft(true,205,async(id)=>{calls.push(id)},()=>{}),"ready");
 assert.deepEqual(calls,[205]);
});
test("mood generation failure is logged but does not prevent saving the song",async()=>{
 const errors:unknown[]=[];
 assert.equal(await runOptionalMoodDraft(true,205,async()=>{throw new Error("API unavailable")},error=>errors.push(error)),"failed");
 assert.equal(errors.length,1);
});
