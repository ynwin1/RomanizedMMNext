import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SongCoversCarousel from "@/app/components/music-box/SongCoversCarousel";
import { nextCoverScrollPosition, youtubeCoverEmbedUrl } from "@/app/components/music-box/song-covers.types";

const covers = [
  { id: "a", youtubeVideoId: "PFkeRVvPPQ4", title: "Acoustic cover", description: "Guitar arrangement" },
  { id: "b", youtubeVideoId: "dQw4w9WgXcQ", title: "Piano instrumental" },
];

test("no empty carousel when a song has no approved videos", () => {
  assert.equal(renderToStaticMarkup(React.createElement(SongCoversCarousel, {covers: [], locale: "en"})), "");
});

test("carousel renders safe YouTube links, titles and optional descriptions", () => {
  const html = renderToStaticMarkup(React.createElement(SongCoversCarousel, {covers, locale:"en"}));
  assert.match(html, /Covers &amp; Interpretations/);
  assert.match(html, /Acoustic cover/);
  assert.match(html, /Guitar arrangement/);
  assert.match(html, /Piano instrumental/);
  assert.match(html, /https:\/\/www\.youtube\.com\/watch\?v=PFkeRVvPPQ4/);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /snap-mandatory/);
  assert.match(html, /Play cover here/);
  assert.match(html, /Previous covers/);
  assert.match(html, /Next covers/);
  assert.doesNotMatch(html, /<iframe|autoplay=/i);
});

test("single cover does not show navigation arrows and Burmese locale is supported", () => {
  const html = renderToStaticMarkup(React.createElement(SongCoversCarousel, {covers:covers.slice(0,1),locale:"my"}));
  assert.match(html, /ပြန်လည်သီဆိုမှုများ/);
  assert.doesNotMatch(html, /aria-label="ရှေ့သို့"/);
});

test("scroll navigation clamps to beginning and end, including invalid dimensions", () => {
  assert.equal(nextCoverScrollPosition(120, 1, 320, 900), 440);
  assert.equal(nextCoverScrollPosition(120, -1, 320, 900), 0);
  assert.equal(nextCoverScrollPosition(820, 1, 320, 900), 900);
  assert.equal(nextCoverScrollPosition(100, 1, 0, 900), 0);
});

test("embed URL is privacy-enhanced and never enables autoplay", () => {
  assert.equal(youtubeCoverEmbedUrl("PFkeRVvPPQ4"), "https://www.youtube-nocookie.com/embed/PFkeRVvPPQ4?rel=0");
  for (const invalid of ["", "abc", "PFkeRVvPPQ4?autoplay=1", "PFkeRVvPPQ4/../"]) {
    assert.equal(youtubeCoverEmbedUrl(invalid), null);
  }
});

test("the thumbnail renders as a local play button with an external watch fallback", () => {
  const html = renderToStaticMarkup(React.createElement(SongCoversCarousel, {covers, locale:"en"}));
  assert.match(html, /<button[^>]*aria-label="Play cover here: Acoustic cover"/);
  assert.match(html, /aria-label="Watch on YouTube: Acoustic cover"/);
  assert.doesNotMatch(html, /<iframe/);
});

test("mobile carousel is constrained to its parent and resizes alongside cards", () => {
  const html=renderToStaticMarkup(React.createElement(SongCoversCarousel,{covers,locale:"en"}));
  assert.match(html, /max-w-full/);
  assert.match(html, /snap-start/);
  assert.match(html, /sm:w-\[calc/);
  assert.match(html, /lg:w-\[calc/);
  assert.match(html, /focus-visible:outline/);
});

test("long titles and descriptions stay inside their cards", () => {
  const html=renderToStaticMarkup(React.createElement(SongCoversCarousel,{
    covers:[{...covers[0],title:"Long song title ".repeat(45),description:"Details ".repeat(80)}],
    locale:"en",
  }));
  assert.match(html, /line-clamp-2 break-words/);
  assert.match(html, /line-clamp-3 break-words/);
  assert.doesNotMatch(html, /<iframe/);
});
