import type { LyricsV2, LyricsV2Entry } from "../domain/lyrics-v2.types";
import { parseLyricsV2 } from "./lyrics-v2.validation";

export class LyricsV2BuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LyricsV2BuildError";
  }
}

function alignedLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

export function buildLyricsV2FromAlignedText(
  source: string,
  romanized: string,
  meaning: string,
): LyricsV2 {
  const sourceLines = alignedLines(source);
  const romanizedLines = alignedLines(romanized);
  const meaningLines = alignedLines(meaning);

  if (
    sourceLines.length !== romanizedLines.length ||
    sourceLines.length !== meaningLines.length
  ) {
    throw new LyricsV2BuildError(
      "Burmese, Romanized, and Meaning lyrics must have matching line counts.",
    );
  }

  const entries: LyricsV2Entry[] = [];
  for (let index = 0; index < sourceLines.length; index++) {
    const burmese = sourceLines[index]!;
    const romanizedLine = romanizedLines[index]!;
    const meaningLine = meaningLines[index]!;
    const sourceBlank = !burmese.trim();

    if (sourceBlank) {
      if (romanizedLine.trim() || meaningLine.trim()) {
        throw new LyricsV2BuildError(
          "Lyric section breaks must be blank across Burmese, Romanized, and Meaning.",
        );
      }
      if (entries.length > 0 && entries[entries.length - 1]?.kind !== "break") {
        entries.push({ kind: "break" });
      }
      continue;
    }

    if (!romanizedLine.trim()) {
      throw new LyricsV2BuildError(
        "Every Burmese lyric line must have a Romanized line.",
      );
    }

    entries.push({
      kind: "line",
      burmese,
      romanized: romanizedLine,
      meaning: meaningLine.trim() ? meaningLine : null,
    });
  }

  if (entries[entries.length - 1]?.kind === "break") entries.pop();
  if (!entries.some(entry => entry.kind === "line")) {
    throw new LyricsV2BuildError("Lyrics must contain at least one lyric line.");
  }

  return parseLyricsV2({ version: 2, entries });
}
