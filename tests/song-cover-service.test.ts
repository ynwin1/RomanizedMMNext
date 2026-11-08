import test from "node:test";
import assert from "node:assert/strict";
import { SongCoverService, CoverConflictError, CoverNotFoundError } from "@/modules/songs/application/song-cover.service";
import type { SongCoverRepository, StoredSongCover } from "@/modules/songs/application/song-cover.repository";
import type { SongCoverVideo } from "@/modules/songs/domain/song-cover.types";

const videoId = "dQw4w9WgXcQ";
const otherVideoId = "PFkeRVvPPQ4";
const id1 = "a".repeat(24);
const id2 = "b".repeat(24);

function fixture() {
  let records: StoredSongCover[] = [];
  let counter = 0;
  const repository: SongCoverRepository = {
    async list(mmid, status) { return records.filter(r => r.mmid === mmid && (!status || r.status === status)).sort((a,b) => a.sortOrder-b.sortOrder); },
    async get(mmid, id) { return records.find(r => r.mmid === mmid && r.id === id) ?? null; },
    async insert(input: SongCoverVideo) {
      const row = { ...input, id: (++counter).toString(16).padStart(24, "0") };
      records.push(row); return row;
    },
    async edit(mmid, id, updates, expected) {
      const row = records.find(r => r.mmid === mmid && r.id === id && (!expected || r.status === expected));
      if (!row) return null;
      Object.assign(row, updates); return { ...row };
    },
    async remove(mmid,id) {
      const before = records.length;
      records = records.filter(r => !(r.mmid === mmid && r.id === id));
      return records.length !== before;
    },
    async reorder(mmid,ids) { ids.forEach((id,sortOrder) => { const row=records.find(r=>r.mmid===mmid && r.id===id); if (row) row.sortOrder=sortOrder; }); },
  };
  return { service: new SongCoverService(repository, async mmid => mmid === 205), repository, get records() { return records; } };
}

test("admin adds canonical ID, approved status, optional description and display order", async () => {
  const { service } = fixture();
  const first = await service.adminAdd(205, {youtubeUrl:`https://youtu.be/${videoId}`}, "admin");
  assert.equal(first.youtubeVideoId, videoId);
  assert.equal(first.status, "approved");
  assert.equal(first.source, "admin");
  assert.equal(first.description, undefined);
  assert.equal(first.reviewedBy, "admin");
  const second = await service.adminAdd(205, {youtubeUrl:`https://youtube.com/watch?v=${otherVideoId}`, description:"Guitar"}, "admin");
  assert.equal(second.sortOrder, 1);
  assert.deepEqual((await service.approved(205)).map(v=>v.youtubeVideoId),[videoId,otherVideoId]);
});

test("duplicate YouTube URL variants and unknown songs cannot be added", async () => {
  const { service } = fixture();
  await assert.rejects(service.adminAdd(999, {youtubeUrl:`https://youtu.be/${videoId}`}, "a"), CoverNotFoundError);
  await service.adminAdd(205,{youtubeUrl:`https://youtu.be/${videoId}`},"a");
  await assert.rejects(service.adminAdd(205,{youtubeUrl:`https://youtube.com/watch?v=${videoId}&t=20`},"a"),CoverConflictError);
  await assert.rejects(service.adminAdd(205,{youtubeUrl:"https://example.com/foo"},"a"));
});

test("approval listing excludes pending and rejected submissions", async () => {
  const { service, repository } = fixture();
  await repository.insert({mmid:205,youtubeVideoId:videoId,status:"pending",source:"community",sortOrder:0});
  await repository.insert({mmid:205,youtubeVideoId:otherVideoId,status:"rejected",source:"community",sortOrder:1});
  assert.equal((await service.approved(205)).length,0);
  const pending = (await service.adminList(205))[0];
  const accepted = await service.adminReview(205,pending.id,"approved","reviewer");
  assert.equal(accepted.status,"approved");
  assert.equal(accepted.reviewedBy,"reviewer");
  assert.equal((await service.approved(205)).length,1);
  await assert.rejects(service.adminReview(205,pending.id,"rejected","reviewer"),CoverConflictError);
});

test("editing and deleting are scoped by song ID", async () => {
  const { service } = fixture();
  const cover=await service.adminAdd(205,{youtubeUrl:`https://youtu.be/${videoId}`},"a");
  await assert.rejects(service.adminEdit(999,cover.id,{description:"other"}),CoverNotFoundError);
  const edited=await service.adminEdit(205,cover.id,{description:" Piano cover "});
  assert.equal(edited.description,"Piano cover");
  await assert.rejects(service.adminEdit(205,cover.id,{status:"pending"}));
  await service.adminRemove(205,cover.id);
  assert.equal((await service.approved(205)).length,0);
});

test("reordering requires exactly all IDs without duplicates", async () => {
  const { service } = fixture();
  const first=await service.adminAdd(205,{youtubeUrl:`https://youtu.be/${videoId}`},"a");
  const second=await service.adminAdd(205,{youtubeUrl:`https://youtu.be/${otherVideoId}`},"a");
  for (const ids of [[first.id],[first.id,first.id],[first.id,id1],[id1,id2]]) {
    await assert.rejects(service.adminReorder(205,ids),CoverConflictError);
  }
  await service.adminReorder(205,[second.id,first.id]);
  assert.deepEqual((await service.approved(205)).map(v=>v.id),[second.id,first.id]);
});
