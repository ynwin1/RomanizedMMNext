import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SuggestSongCover from "@/app/components/music-box/SuggestSongCover";
import { SuggestCoverSchema } from "@/modules/songs/application/song-cover.validation";

test("suggestion invitation appears even with no approved videos", () => {
  const html = renderToStaticMarkup(React.createElement(SuggestSongCover, {mmid:205,locale:"en"}));
  assert.match(html,/Suggest a cover/);
  assert.match(html,/Know a great cover of this song\?/);
  assert.match(html,/Found a version worth sharing\?/);
  assert.match(html,/flex-col items-center/);
  assert.match(html,/text-center/);
  assert.match(html,/max-w-xl/);
  assert.doesNotMatch(html,/<form/);
});

test("Burmese invitation is translated", () => {
  const html = renderToStaticMarkup(React.createElement(SuggestSongCover, {mmid:205,locale:"my"}));
  assert.match(html,/ပြန်လည်သီဆိုထားသော/);
  assert.match(html,/ဗီဒီယိုကောင်းလေး သိလား/);
  assert.match(html,/YouTube လင့်ခ်လေး/);
});

test("visitor schema cannot set approved status, moderation fields or song IDs", () => {
  const basic = {youtubeUrl:"https://youtu.be/PFkeRVvPPQ4"};
  assert.equal(SuggestCoverSchema.safeParse(basic).success,true);
  assert.equal(SuggestCoverSchema.safeParse({...basic,contributorName:"Anon",description:"Piano"}).success,true);
  for(const bad of [{status:"approved"},{source:"admin"},{mmid:1},{title:"Fake title"},{reviewedBy:"admin"},{description:"x".repeat(501)}]){
    assert.equal(SuggestCoverSchema.safeParse({...basic,...bad}).success,false);
  }
});
