import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMoodometer } from "@/modules/songs/application/moodometer.evaluation";

test("evaluation captures agreement, high score clustering and diversity",()=>{
 const result=evaluateMoodometer([
  {id:"love",expectedMoods:["romantic","longing"],predictedMoods:[{moodId:"romantic",score:9.5},{moodId:"longing",score:9.1},{moodId:"hopeful",score:9}]},
  {id:"grief",expectedMoods:["heartbroken"],predictedMoods:[{moodId:"romantic",score:9.4},{moodId:"melancholic",score:9.2},{moodId:"longing",score:8.7}]},
 ]);
 assert.equal(result.songs,2);
 assert.equal(result.expectedMoodRecall,0.667);
 assert.equal(result.topMoodAgreement,0.5);
 assert.equal(result.distinctMoods,4);
 assert.equal(result.highScoreShare,0.833);
 assert.ok(result.cautions.some(x=>x.includes("Scores clustered")));
 assert.ok(result.cautions.some(x=>x.includes("dominates")));
});
test("rejects duplicates, invalid mood IDs, and unordered predictions",()=>{
 const item={id:"a",expectedMoods:["romantic"],predictedMoods:[{moodId:"romantic",score:7},{moodId:"hopeful",score:5},{moodId:"longing",score:2}]};
 assert.throws(()=>evaluateMoodometer([item,item]),/Duplicate evaluation case/);
 assert.throws(()=>evaluateMoodometer([{...item,predictedMoods:[item.predictedMoods[0],item.predictedMoods[0],item.predictedMoods[2]]}]),/Duplicate predicted/);
 assert.throws(()=>evaluateMoodometer([{...item,predictedMoods:[...item.predictedMoods].reverse()}]),/ranked/);
 assert.throws(()=>evaluateMoodometer([{...item,expectedMoods:["invalid"]}]));
});
