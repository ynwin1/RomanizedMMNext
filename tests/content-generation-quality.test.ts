import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateCompleteGeneratedContent,
  evaluateEditorialContent,
  evaluateGeneratedLines,
} from "@/modules/content-generation";

test("quality eval accepts capitalized Latin output and one-line editorial content", () => {
  const romanized = evaluateGeneratedLines("romanized", [
    { index: 0, text: "Min ko chit tal." },
    { index: 1, text: "Nin ko ma may bu." },
  ]);
  const meaning = evaluateGeneratedLines("meaning", [
    { index: 0, text: "I love you." },
    { index: 1, text: "I will not forget you." },
  ]);
  const editorial = evaluateEditorialContent({
    about: "A bittersweet song about letting go of someone you still love.",
    whenToListen: "When you need a reflective heartbreak song late at night.",
  });

  assert.equal(romanized.valid, true);
  assert.equal(meaning.valid, true);
  assert.equal(editorial.valid, true);
});

test("quality eval flags Myanmar-script leakage in romanization and meaning", () => {
  const romanized = evaluateGeneratedLines("romanized", [
    { index: 0, text: "Min ကို chit tal." },
  ]);
  const meaning = evaluateGeneratedLines("meaning", [
    { index: 0, text: "I love မင်း." },
  ]);

  assert.deepEqual(romanized.issues.map(issue => issue.code), [
    "romanization_contains_myanmar_script",
  ]);
  assert.deepEqual(meaning.issues.map(issue => issue.code), [
    "meaning_contains_myanmar_script",
  ]);
});

test("quality eval detects lowercase sentence starts after boundaries", () => {
  const report = evaluateGeneratedLines("meaning", [
    { index: 0, text: "i still love you." },
    { index: 1, text: "This continues correctly." },
    { index: 2, text: "" },
    { index: 3, text: "another new section starts here." },
  ]);

  assert.equal(report.valid, false);
  assert.deepEqual(
    report.issues.map(issue => [issue.code, issue.lineIndex]),
    [
      ["meaning_sentence_not_capitalized", 0],
      ["meaning_sentence_not_capitalized", 3],
    ],
  );
});

test("quality eval allows lowercase continuation lines when previous sentence is unfinished", () => {
  const report = evaluateGeneratedLines("meaning", [
    { index: 0, text: "Even if I try" },
    { index: 1, text: "to forget you, I cannot." },
    { index: 2, text: "This is a new sentence." },
  ]);

  assert.equal(report.valid, true);
});

test("complete-draft quality eval checks reused stored generated content", () => {
  const report = evaluateCompleteGeneratedContent({
    romanized: "min ko chit tal.",
    meaning: "I love you.",
    about: "One line.",
    whenToListen: "One line.",
  });

  assert.equal(report.valid, false);
  assert.ok(report.issues.some(issue => issue.code === "romanization_sentence_not_capitalized"));
});

test("editorial quality eval rejects line breaks", () => {
  const report = evaluateEditorialContent({
    about: "Line one\nLine two",
    whenToListen: "One line",
  });

  assert.equal(report.valid, false);
  assert.deepEqual(report.issues.map(issue => issue.code), ["about_multiline"]);
});
