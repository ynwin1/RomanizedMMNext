import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {openRequestResetFilter} from "@/modules/requests/infrastructure/song-request.bulk-reject";
import {SongRequestService} from "@/modules/requests/application/song-request.service";
import type {ISongRequestRepository} from "@/modules/requests/application/song-request.repository";

test("reset targets only pending/reviewing/legacy statuses before cutoff",()=>{
  const cutoff=new Date("2026-11-07T00:00:00.000Z");
  assert.deepEqual(openRequestResetFilter(cutoff),{
    createdAt:{$lte:cutoff},
    $or:[{status:{$in:["pending","reviewing"]}},{status:{$exists:false}},{status:null}],
  });
  assert.doesNotMatch(JSON.stringify(openRequestResetFilter(cutoff)),/accepted|completed|added/);
});

test("service validates identity and cutoff before writing",async()=>{
  let called=0;
  const repo={rejectOpenBefore:async()=>{called++;return 9;}} as unknown as ISongRequestRepository;
  const service=new SongRequestService(repo);
  await assert.rejects(service.rejectOpenBefore(new Date("invalid"),"admin"));
  await assert.rejects(service.rejectOpenBefore(new Date(Date.now()+86400000),"admin"));
  await assert.rejects(service.rejectOpenBefore(new Date(),"  "));
  assert.equal(called,0);
  assert.equal(await service.rejectOpenBefore(new Date(),"admin"),9);
  assert.equal(called,1);
});

test("bulk action requires admin confirmation and records audit actor",()=>{
  const actions=readFileSync("app/admin/requests/request-actions.ts","utf8");
  const form=readFileSync("app/admin/requests/bulk-reject-open-requests.tsx","utf8");
  assert.match(actions,/await requireAdmin\(\)/);
  assert.match(actions,/confirmation !== "REJECT OPEN REQUESTS"/);
  assert.match(actions,/principal\.userId/);
  assert.match(form,/Confirm bulk rejection/);
  assert.match(form,/Accepted, completed, and previously rejected requests remain unchanged/);
});
