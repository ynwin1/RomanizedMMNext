import test from "node:test";
import assert from "node:assert/strict";
import Song from "@/modules/songs/infrastructure/song.model";
import Artist from "@/modules/artists/infrastructure/artist.model";
import SongRequest from "@/modules/requests/infrastructure/song-request.model";

test("canonical admin-write models enable timestamps and updatedBy audit fields", () => {
  assert.equal(Song.schema.options.timestamps, true);
  assert.ok(Song.schema.path("createdAt"));
  assert.ok(Song.schema.path("updatedAt"));
  assert.ok(Song.schema.path("updatedBy"));

  assert.equal(Artist.schema.options.timestamps, true);
  assert.ok(Artist.schema.path("createdAt"));
  assert.ok(Artist.schema.path("updatedAt"));
  assert.ok(Artist.schema.path("updatedBy"));

  assert.equal(SongRequest.schema.options.timestamps, true);
  assert.ok(SongRequest.schema.path("createdAt"));
  assert.ok(SongRequest.schema.path("updatedAt"));
  assert.ok(SongRequest.schema.path("updatedBy"));
});
