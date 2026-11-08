import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {requestAdminFilter} from "@/modules/requests/infrastructure/song-request.admin-filter";

test("song-request page provides the existing submission form and shows an open status", () => {
  const page=readFileSync("app/(pages)/[locale]/(songs)/song-request/page.tsx","utf8");
  assert.match(page, /<SongRequestForm\s*\/>/);
  assert.match(page, /translator\("open"\)/);
  assert.match(page, /translator\("openMessage"\)/);
  assert.doesNotMatch(page, /translator\("paused"\)|translator\("stopMessage"\)/);
});

test("both locales provide the reopened request copy", () => {
  for (const locale of ["en","my"]) {
    const messages=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8")).SongRequestPage;
    for (const key of ["open","openMessage","requestSong","songTitle","artist","submit"]) {
      assert.ok(messages[key],`${locale}: ${key}`);
    }
  }
});

test("public request queue only lists pending and reviewing entries, not rejected history", () => {
  const repository=readFileSync("modules/requests/infrastructure/song-request.repository.ts","utf8");
  assert.match(repository, /SongRequest\.find\(requestAdminFilter\("", "pending"\)\)/);
  const query=requestAdminFilter("","pending");
  assert.deepEqual(query,{$and:[{$or:[
    {status:{$in:["pending","reviewing"]}},
    {status:{$exists:false}},
    {status:null},
  ]}]});
});
