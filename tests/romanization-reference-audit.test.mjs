import test from "node:test";
import assert from "node:assert/strict";
import {extractReferences, auditReferences} from "../scripts/romanization-reference-core.mjs";

const songs = [
  {mmid: 1, updatedAt: "2026-10-01", lyricsV2: {version: 2, entries: [
    {kind: "line", burmese: "မင်္ဂလာပါ", romanized: "Mingalar par"},
    {kind: "break"},
    {kind: "line", burmese: "ချစ်တယ်", romanized: "Chit tal"},
  ]}},
  {mmid: 2, updatedAt: "2026-10-02", lyricsV2: {version: 2, entries: [
    {kind: "line", burmese: " မင်္ဂလာပါ ", romanized: "Mingalar par"},
    {kind: "line", burmese: "ချစ်တယ်", romanized: "Chit tae"},
    {kind: "line", burmese: "တစ်ယောက်တည်း", romanized: "Ta yout htae"},
  ]}},
];

test("reference extraction retains source alignment and requires explicit trust", () => {
  const {records, problems} = extractReferences(songs, new Set(["1:0", "2:1"]));
  assert.equal(records.length, 5);
  assert.equal(problems.length, 0);
  assert.deepEqual(records.map(r => r.key), ["1:0", "1:2", "2:0", "2:1", "2:2"]);
  assert.deepEqual(records.map(r => r.trust), ["reviewed", "provisional", "provisional", "reviewed", "provisional"]);
  assert.equal(records[2].burmese, "မင်္ဂလာပါ");
});

test("audit distinguishes repeated exact matches from spelling conflicts", () => {
  const {records, problems} = extractReferences(songs);
  const report = auditReferences(records, problems);
  assert.equal(report.summary.linePairs, 5);
  assert.equal(report.summary.reviewedPairs, 0);
  assert.equal(report.summary.uniqueBurmeseLines, 3);
  assert.equal(report.summary.repeatedLines, 1);
  assert.equal(report.summary.conflictingLines, 1);
  assert.equal(report.summary.repeatCoveragePercent, 80);
  assert.equal(report.conflicts[0].burmese, "ချစ်တယ်");
  assert.equal(report.conflicts[0].variants.length, 2);
});

test("invalid songs, malformed entries and empty pairs are excluded and reported", () => {
  const {records, problems} = extractReferences([
    {mmid: 3, lyricsV2: {version: 1, entries: []}},
    {mmid: 4, lyricsV2: {version: 2, entries: [{kind: "line", burmese: " ", romanized: "test"}, {kind: "what"}]}},
  ]);
  assert.equal(records.length, 0);
  assert.equal(problems.length, 3);
  assert.equal(auditReferences(records, problems).summary.repeatCoveragePercent, 0);
});

test("stale trusted reference keys are reported rather than silently accepted", () => {
  const {records, problems} = extractReferences(songs, new Set(["999:0"]));
  assert.equal(records.every(record => record.trust === "provisional"), true);
  assert.match(problems[0].reason, /Trusted key not found/);
});
