import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SuggestSongCover from "@/app/components/music-box/SuggestSongCover";
import { SuggestCoverSchema } from "@/modules/songs/application/song-cover.validation";

test("suggestion invitation appears even with no approved videos", () => {
  const html = renderToStaticMarkup(React.createElement(SuggestSongCover, {mmid:205,locale:"en"}));
  assert.match(html,/Suggest a cover/);
  assert.doesNotMatch(html,/<form/);
});

test("Burmese invitation is translated", () => {
  const html = renderToStaticMarkup(React.createElement(SuggestSongCover, {mmid:205,locale:"my"}));
  assert.match(html,/ပြန်လည်သီဆိုထားသော/);
});

test("visitor schema cannot set approved status, moderation fields or song IDs", () => {
  const basic = {youtubeUrl:"https://youtu.be/PFkeRVvPPQ4"};
  assert.equal(SuggestCoverSchema.safeParse(basic).success,true);
  assert.equal(SuggestCoverSchema.safeParse({...basic,contributorName:"Anon",description:"Piano"}).success,true);
  for(const bad of [{status:"approved"},{source:"admin"},{mmid:1},{title:"Fake title"},{reviewedBy:"admin"},{description:"x".repeat(501)}]){
    assert.equal(SuggestCoverSchema.safeParse({...basic,...bad}).success,false);
  }
});
