import test from "node:test";
import assert from "node:assert/strict";
import {selectMissingMoodCandidates} from "@/modules/songs/application/moodometer.backfill";
test("skips all songs with any analysis and never chooses more than the cap",()=>{
 const songs=[{mmid:1,songName:"One"},{mmid:2,songName:"Two"},{mmid:3,songName:"Three"}];
 assert.deepEqual(selectMissingMoodCandidates(songs,new Set([2]),2),[{mmid:1,songName:"One"},{mmid:3,songName:"Three"}]);
 assert.deepEqual(selectMissingMoodCandidates(songs,new Set(),1),[songs[0]]);
});
