import type { GeneratedLyricLine } from "../domain/content-generation.types";
import type {
  ContentGenerationQualityIssue,
  ContentGenerationQualityReport,
} from "../domain/content-generation-quality.types";

const MYANMAR_SCRIPT = /[\u1000-\u109F\uA9E0-\uA9FF\uAA60-\uAA7F]/u;

function lowercaseSentenceStartLines(lines: GeneratedLyricLine[]): number[] {
  const invalid = new Set<number>();
  let startsSentence = true;

  for (const line of lines) {
    if (line.text === "") {
      startsSentence = true;
      continue;
    }

    for (const character of line.text) {
      if (/[A-Za-z]/.test(character)) {
        if (startsSentence && character !== character.toUpperCase()) {
          invalid.add(line.index);
        }
        startsSentence = false;
        continue;
      }

      if (/[.!?]/.test(character)) {
        startsSentence = true;
      }
    }
  }

  return [...invalid];
}

function lineIssues(
  field: "romanized" | "meaning",
  lines: GeneratedLyricLine[],
): ContentGenerationQualityIssue[] {
  const issues: ContentGenerationQualityIssue[] = [];
  const containsMyanmarCode = field === "romanized"
    ? "romanization_contains_myanmar_script"
    : "meaning_contains_myanmar_script";
  const capitalizationCode = field === "romanized"
    ? "romanization_sentence_not_capitalized"
    : "meaning_sentence_not_capitalized";

  for (const line of lines) {
    if (MYANMAR_SCRIPT.test(line.text)) {
      issues.push({
        code: containsMyanmarCode,
        field,
        lineIndex: line.index,
        message: field === "romanized"
          ? "Romanization must not contain Myanmar script."
          : "English meaning must not contain Myanmar script.",
      });
    }
  }

  for (const lineIndex of lowercaseSentenceStartLines(lines)) {
    issues.push({
      code: capitalizationCode,
      field,
      lineIndex,
      message: "Each detected sentence must begin with a capital letter.",
    });
  }

  return issues;
}

export function evaluateGeneratedLines(
  field: "romanized" | "meaning",
  lines: GeneratedLyricLine[],
): ContentGenerationQualityReport {
  const issues = lineIssues(field, lines);
  return { valid: issues.length === 0, issues };
}

export function evaluateEditorialContent(input: {
  about: string;
  whenToListen: string;
}): ContentGenerationQualityReport {
  const issues: ContentGenerationQualityIssue[] = [];

  if (/[\r\n]/.test(input.about)) {
    issues.push({
      code: "about_multiline",
      field: "about",
      message: "About must be a single line.",
    });
  }

  if (/[\r\n]/.test(input.whenToListen)) {
    issues.push({
      code: "when_to_listen_multiline",
      field: "whenToListen",
      message: "When to listen must be a single line.",
    });
  }

  return { valid: issues.length === 0, issues };
}

export function evaluateCompleteGeneratedContent(input: {
  romanized: string;
  meaning: string;
  about: string;
  whenToListen: string;
}): ContentGenerationQualityReport {
  const toLines = (value: string): GeneratedLyricLine[] =>
    value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
      .map((text, index) => ({ index, text }));

  const issues = [
    ...evaluateGeneratedLines("romanized", toLines(input.romanized)).issues,
    ...evaluateGeneratedLines("meaning", toLines(input.meaning)).issues,
    ...evaluateEditorialContent({
      about: input.about,
      whenToListen: input.whenToListen,
    }).issues,
  ];

  return { valid: issues.length === 0, issues };
}
