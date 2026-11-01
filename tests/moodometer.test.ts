import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMoodometer, moodometerPrompt } from "@/modules/songs/application/moodometer.analysis";
import { MoodometerAnalysisSchema } from "@/modules/songs/application/moodometer.validation";

const sample = {
  title:"Sample",artistNames:["Singer"],genre:"Pop",
  lyrics:{version:2 as const,entries:[{kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"I love you"}]},
};
test("AI prompt uses original Burmese and meaning, explicitly avoids audio assumptions",()=>{
 const prompt = moodometerPrompt(sample);
 assert.match(prompt,/ချစ်တယ်/);
 assert.match(prompt,/I love you/);
 assert.match(prompt,/not music tempo/);
});
test("AI result is a validated, draft, top-three moodometer on a ten-point scale",async()=>{
 const result = await analyzeMoodometer(sample,async()=>({
   moods:[{moodId:"romantic",score:8.7},{moodId:"longing",score:6.4},{moodId:"hopeful",score:3.2}],
   summary:"The lyrics express affection.",
 }),"test-model");
 assert.equal(result.status,"draft");
 assert.equal(result.moods.length,3);
 assert.equal(result.moods[0].score,8.7);
 assert.equal(result.lyricsFingerprint.length,64);
});
test("rejects invalid decimals, duplicate moods, ascending scores and extra categories",()=>{
 const base={version:1,source:"lyrics",status:"draft",lyricsFingerprint:"a".repeat(64),modelVersion:"model",summary:"Summary"};
 const moods=[{moodId:"romantic",score:8.7},{moodId:"longing",score:6.4},{moodId:"hopeful",score:3.2}];
 assert.equal(MoodometerAnalysisSchema.safeParse({...base,moods}).success,true);
 assert.equal(MoodometerAnalysisSchema.safeParse({...base,moods:[{...moods[0],score:8.71},...moods.slice(1)]}).success,false);
 assert.equal(MoodometerAnalysisSchema.safeParse({...base,moods:[moods[0],moods[0],moods[2]]}).success,false);
 assert.equal(MoodometerAnalysisSchema.safeParse({...base,moods:[moods[2],moods[1],moods[0]]}).success,false);
 assert.equal(MoodometerAnalysisSchema.safeParse({...base,moods:[{...moods[0],moodId:"random"},...moods.slice(1)]}).success,false);
});
