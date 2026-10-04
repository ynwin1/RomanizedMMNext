import test from "node:test";
import assert from "node:assert/strict";
import {
  LyricsV2Schema,
  parseLyricsV2,
} from "@/modules/songs/application/lyrics-v2.validation";
import type { LyricsV2 } from "@/modules/songs/domain/lyrics-v2.types";

test("lyrics v2 keeps aligned rows and explicit verse breaks", () => {
  const parsed = parseLyricsV2({
    version: 2,
    entries: [
      {
        kind: "line",
        burmese: "  မင်းကို ချစ်တယ်။  ",
        romanized: "  min ko chit tal.  ",
        meaning: "  I love you.  ",
      },
      { kind: "break" },
      {
        kind: "line",
        burmese: "Oh!",
        romanized: "Oh!",
        meaning: null,
      },
    ],
  });

  const expected: LyricsV2 = {
    version: 2,
    entries: [
      {
        kind: "line",
        burmese: "မင်းကို ချစ်တယ်။",
        romanized: "min ko chit tal.",
        meaning: "I love you.",
      },
      { kind: "break" },
      {
        kind: "line",
        burmese: "Oh!",
        romanized: "Oh!",
        meaning: null,
      },
    ],
  };

  assert.deepEqual(parsed, expected);
});

test("lyrics v2 allows mixed-language source text and intentional missing meaning", () => {
  assert.equal(LyricsV2Schema.safeParse({
    version: 2,
    entries: [
      {
        kind: "line",
        burmese: "I still remember",
        romanized: "I still remember",
        meaning: null,
      },
      {
        kind: "line",
        burmese: "အိုး ဟေး",
        romanized: "oh hey",
        meaning: null,
      },
    ],
  }).success, true);
});

test("lyrics v2 rejects empty aligned fields and ambiguous empty meaning", () => {
  for (const entry of [
    { kind: "line", burmese: "", romanized: "romanized", meaning: "meaning" },
    { kind: "line", burmese: "စာသား", romanized: "   ", meaning: "meaning" },
    { kind: "line", burmese: "စာသား", romanized: "romanized", meaning: "" },
  ]) {
    assert.equal(LyricsV2Schema.safeParse({
      version: 2,
      entries: [entry],
    }).success, false);
  }
});

test("lyrics v2 enforces canonical break placement", () => {
  const line = {
    kind: "line" as const,
    burmese: "စာသား",
    romanized: "sar thar",
    meaning: "lyrics",
  };

  for (const entries of [
    [{ kind: "break" as const }, line],
    [line, { kind: "break" as const }],
    [line, { kind: "break" as const }, { kind: "break" as const }, line],
    [{ kind: "break" as const }],
  ]) {
    assert.equal(LyricsV2Schema.safeParse({ version: 2, entries }).success, false);
  }
});

test("lyrics v2 rejects unknown fields and unsupported versions", () => {
  const line = {
    kind: "line",
    burmese: "စာသား",
    romanized: "sar thar",
    meaning: "lyrics",
  };

  assert.equal(LyricsV2Schema.safeParse({
    version: 1,
    entries: [line],
  }).success, false);

  assert.equal(LyricsV2Schema.safeParse({
    version: 2,
    entries: [{ ...line, legacyIndex: 1 }],
  }).success, false);

  assert.equal(LyricsV2Schema.safeParse({
    version: 2,
    entries: [{ kind: "break", label: "Verse 2" }],
  }).success, false);
});
