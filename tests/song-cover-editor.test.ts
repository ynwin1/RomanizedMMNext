import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SongCoverEditor from "@/app/admin/songs/song-cover-editor";

test("cover editor renders a separate add form with optional description", () => {
  const html = renderToStaticMarkup(React.createElement(SongCoverEditor, { mmid: 205, initialCovers: [] }));
  assert.match(html, /Add a YouTube cover/);
  assert.match(html, /YouTube URL/);
  assert.match(html, /Description/);
  assert.match(html, /\(optional\)/);
  assert.match(html, /No covers for this song yet/);
  assert.match(html, /disabled=""/);
});

test("cover editor lists existing covers and their statuses without showing an empty description", () => {
  const html = renderToStaticMarkup(React.createElement(SongCoverEditor, {
    mmid: 205,
    initialCovers: [
      { id: "a".repeat(24), mmid: 205, youtubeVideoId: "PFkeRVvPPQ4", source: "admin", status: "approved", sortOrder: 0, description: "Guitar instrumental" },
      { id: "b".repeat(24), mmid: 205, youtubeVideoId: "dQw4w9WgXcQ", source: "community", status: "pending", sortOrder: 1 },
    ],
  }));
  assert.match(html, /Guitar instrumental/);
  assert.match(html, /Community suggestion/);
  assert.match(html, /pending/);
  assert.match(html, /https:\/\/www\.youtube\.com\/watch\?v=PFkeRVvPPQ4/);
  assert.match(html, /Existing covers/);
  assert.doesNotMatch(html, /No covers for this song yet/);
});
