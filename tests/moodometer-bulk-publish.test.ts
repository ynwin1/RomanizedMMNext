import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateAndPublishMissingMoodometer} from "@/modules/songs/application/moodometer.bulk-publish";
import type {MoodometerAnalysis} from "@/modules/songs/domain/moodometer.types";

const analysis: MoodometerAnalysis = {
  version:1,source:"lyrics",status:"draft",lyricsFingerprint:"a".repeat(64),
  moods:[{moodId:"romantic",score:9},{moodId:"longing",score:6},{moodId:"hopeful",score:4}],
  summary:"A longing love song",modelVersion:"test",
};

test("bulk Moodometer generation saves and publishes each successful analysis",async()=>{
  const calls:string[]=[];
  const result=await generateAndPublishMissingMoodometer(205,{
    async generate(mmid){calls.push("generate:"+mmid);return analysis;},
    async saveDraft(mmid,draft){assert.equal(mmid,205);assert.equal(draft.status,"draft");calls.push("save");return {id:"record-1"};},
    async publish(mmid,id){assert.equal(mmid,205);assert.equal(id,"record-1");calls.push("publish");return {id};},
  });
  assert.deepEqual(calls,["generate:205","save","publish"]);
  assert.deepEqual(result,{mmid:205,recordId:"record-1"});
});

test("failed generation or draft storage cannot accidentally publish",async()=>{
  let published=0;
  await assert.rejects(()=>generateAndPublishMissingMoodometer(205,{
    async generate(){throw new Error("AI offline");},
    async saveDraft(){throw new Error("Must not save");},
    async publish(){published++;return {};},
  }),/AI offline/);
  await assert.rejects(()=>generateAndPublishMissingMoodometer(205,{
    async generate(){return analysis;},
    async saveDraft(){throw new Error("Database offline");},
    async publish(){published++;return {};},
  }),/Database offline/);
  assert.equal(published,0);
});

test("a failed publish remains an explicit failure rather than reporting success",async()=>{
  await assert.rejects(()=>generateAndPublishMissingMoodometer(205,{
    async generate(){return analysis;},
    async saveDraft(){return {id:"record-2"};},
    async publish(){return null;},
  }),/saved but not published/);
});

test("admin batch action revalidates public song pages and UI warns before publishing",()=>{
  const action=readFileSync("app/admin/songs/moodometer-batch-actions.ts","utf8");
  const ui=readFileSync("app/admin/songs/moodometer-backfill/moodometer-backfill.tsx","utf8");
  assert.match(action,/await requireAdmin\(\)/);
  assert.match(action,/listMoodometerMissingSongs\(\)/);
  assert.match(action,/generateAndPublishMissingMoodometer\(mmid/);
  assert.match(action,/revalidatePath\("\/\[locale\]\/song\/\[name\]\/\[id\]","page"\)/);
  assert.match(ui,/window\.confirm\(/);
  assert.match(ui,/published immediately/);
  assert.doesNotMatch(ui,/No drafts will be published/);
});
