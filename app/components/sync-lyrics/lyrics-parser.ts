export interface ParsedLyric {
  text: string;
  startTime: number;
}

export function selectLyricsText(
  lyrics: { romanized: string; burmese: string; meaning: string },
  selectedOption: string,
): string {
  if (selectedOption === "romanized") return lyrics.romanized;
  if (selectedOption === "meaning") return lyrics.meaning;
  return lyrics.burmese;
}

/** Pure parsing, safe to execute on the server before hydration. */
export function parseLyricsWithTimestamps(value: string): ParsedLyric[] {
  return value.split("\n").map(line => {
    const match = line.match(/^\[(\d+):(\d+)\](.*)/);
    if (!match) return { text: line.trim(), startTime: -1 };
    return {
      text: match[3].trim(),
      startTime: Number(match[1]) * 60 + Number(match[2]),
    };
  });
}
