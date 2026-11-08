import test from "node:test";
import assert from "node:assert/strict";
import { SongCoverModel } from "@/modules/songs/infrastructure/song-cover.model";

const validCover = {
  mmid: 205,
  youtubeVideoId: "PFkeRVvPPQ4",
  source: "community",
};

test("cover model stores a song mmid and defaults new submissions to pending", () => {
  const record = new SongCoverModel(validCover);
  assert.equal(record.validateSync(), undefined);
  assert.equal(record.mmid, 205);
  assert.equal(record.status, "pending");
  assert.equal(record.sortOrder, 0);
  assert.equal(record.description, undefined);
});

test("optional cover description may be omitted or supplied", () => {
  assert.equal(new SongCoverModel(validCover).validateSync(), undefined);
  const record = new SongCoverModel({ ...validCover, description: "  Guitar instrumental  " });
  assert.equal(record.validateSync(), undefined);
  assert.equal(record.description, "Guitar instrumental");
});

test("cover model rejects bad video IDs, song identifiers, and moderation values", () => {
  for (const overrides of [
    { youtubeVideoId: "not-a-youtube-url" },
    { mmid: 0 },
    { mmid: 1.5 },
    { source: "unknown" },
    { status: "published" },
    { sortOrder: -1 },
    { description: "x".repeat(501) },
  ]) {
    const record = new SongCoverModel({ ...validCover, ...overrides });
    assert.notEqual(record.validateSync(), undefined, JSON.stringify(overrides));
  }
});

test("cover indexes prevent duplicate videos within one song and support ordered listing", () => {
  const indexes = SongCoverModel.schema.indexes();
  assert.ok(indexes.some(([fields, options]) =>
    fields.mmid === 1 && fields.youtubeVideoId === 1 && options.unique === true));
  assert.ok(indexes.some(([fields]) =>
    fields.mmid === 1 && fields.status === 1 && fields.sortOrder === 1));
});
