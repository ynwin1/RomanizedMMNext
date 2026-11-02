import test from "node:test";
import assert from "node:assert/strict";
import {rankMoodCandidates,isMoodId} from "@/modules/songs/application/mood-discovery";
import type {MoodometerAnalysis} from "@/modules/songs/domain/moodometer.types";
const make=(mmid:number,score:number,status:"draft"|"published"="published")=>({
  mmid,analysis:{version:1 as const,source:"lyrics" as const,status,
    lyricsFingerprint:"a".repeat(64),modelVersion:"test",summary:"sample",
    moods:[{moodId:"romantic" as const,score},{moodId:"longing" as const,score:3},{moodId:"hopeful" as const,score:2}]} satisfies MoodometerAnalysis,
});
test("mood discovery ranks published scores and ignores drafts and duplicate songs",()=>{
 const result=rankMoodCandidates([make(1,6),make(2,9),make(3,10,"draft"),make(2,8)],"romantic");
 assert.deepEqual(result,[{mmid:2,score:9},{mmid:1,score:6}]);
});
test("only defined moods can be used in public search",()=>{
 assert.equal(isMoodId("romantic"),true);
 assert.equal(isMoodId("unknown"),false);
});
