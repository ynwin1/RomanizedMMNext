import test from "node:test";
import assert from "node:assert/strict";
import {evaluateRomanization} from "@/modules/romanization-references/application/romanization-evaluation";
import type {EvaluationSong} from "@/modules/romanization-references/application/romanization-evaluation";

function song(mmid: number, burmese: string, romanized: string): EvaluationSong {
  return {mmid, lyricsV2: {version: 2, entries: [{kind: "line", burmese, romanized, meaning: null}]}};
}

test("held-out evaluation never trains on the target song, even with repeated lines", () => {
  const result = evaluateRomanization([song(2, "မင်္ဂလာပါ", "Mingalar par"), song(1, "ကျေးဇူး", "Kyeizu")]);
  assert.equal(result.summary.evaluatedSongs, 2);
  assert.equal(result.summary.evaluatedLines, 2);
  assert.equal(result.summary.seededRecovered, 0, "self-reuse would falsely recover the injected typo");
  assert.equal(result.summary.cleanRegressions, 0);
});

test("cross-song reuse can repair artificial typos without inflating clean scores", () => {
  const result = evaluateRomanization([song(3, "မင်္ဂလာပါ", "Mingalar par"), song(2, "မင်္ဂလာပါ", "Mingalar par"), song(1, "မင်္ဂလာပါ", "Mingalar par")]);
  assert.equal(result.summary.seededCases, 3);
  assert.equal(result.summary.seededRecovered, 3);
  assert.equal(result.summary.cleanRegressions, 0);
  assert.equal(result.summary.cleanChanged, 0);
});

test("R1 privacy-preserving exports without meanings remain valid references", () => {
  const exported = [3, 2, 1].map(mmid => ({mmid, lyricsV2: {version: 2,
    entries: [{kind: "line", burmese: "မင်္ဂလာပါ", romanized: "Mingalar par"}]}})) as unknown as EvaluationSong[];
  const result = evaluateRomanization(exported);
  assert.equal(result.summary.evaluatedSongs, 3);
  assert.equal(result.summary.seededRecovered, 3);
});

test("different trusted spellings are reported as real regressions, not successes", () => {
  const result = evaluateRomanization([song(3, "မင်္ဂလာပါ", "Mingalar par"), song(2, "မင်္ဂလာပါ", "Mingala ba")], 2);
  assert.equal(result.summary.cleanRegressions, 2, "both opposing spellings are overwritten by the held-out alternative");
  assert.ok(result.summary.conflicts === 0, "the held-out sample only has one spelling in training");
});

test("invalid rows, duplicate IDs, and invalid sample sizes are handled deliberately", () => {
  const incomplete = {mmid: 7, lyricsV2: {version: 2, entries: []}} as EvaluationSong;
  assert.equal(evaluateRomanization([incomplete]).summary.evaluatedSongs, 0);
  assert.throws(() => evaluateRomanization([song(1, "a", "b"), song(1, "a", "b")]), /Duplicate song ID/);
  assert.throws(() => evaluateRomanization([], 0), /maxSongs/);
});
