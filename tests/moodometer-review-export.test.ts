import test from "node:test";
import assert from "node:assert/strict";
import {createMoodometerReviewTemplate} from "@/modules/songs/application/moodometer.review-export";
import type {MoodometerRecord} from "@/modules/songs/application/moodometer.service";
const analysis={version:1 as const,source:"lyrics" as const,status:"published" as const,lyricsFingerprint:"a".repeat(64),moods:[{moodId:"romantic" as const,score:8.2},{moodId:"longing" as const,score:7.1},{moodId:"hopeful" as const,score:4.0}],summary:"Love",modelVersion:"gpt-5"};
test("exports published predictions without fabricating human-reviewed labels",()=>{
 const record:MoodometerRecord={id:"1",mmid:205,analysis,createdAt:new Date()};
 const draft:MoodometerRecord={...record,id:"2",mmid:206,analysis:{...analysis,status:"draft"}};
 const result=createMoodometerReviewTemplate([record,record,draft]);
 assert.deepEqual(result,[{id:"song-205",expectedMoods:[],predictedMoods:analysis.moods}]);
});
