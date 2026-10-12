import type {RomanizationReferenceSong} from "./romanization-reference.types";
import {LyricsV2Schema} from "@/modules/songs/application/lyrics-v2.validation";

type Line = {index: number; text: string};
export type RefinementChange = {index: number; kind: "exact-line" | "word"; original: string; corrected: string};

const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s+/gu, " ");
const burmeseWords = (value: string) => [...new Intl.Segmenter("my", {granularity: "word"}).segment(value)]
  .filter(segment => segment.isWordLike).map(segment => segment.segment);
const romanizedTokens = (value: string) => [...value.matchAll(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)];

/** Trust input songs only if the catalogue has been fully human reviewed. */
export function refineRomanization(
  source: Line[], generated: Line[], songs: RomanizationReferenceSong[],
): {lines: Line[]; changes: RefinementChange[]; ambiguousLines: number[]} {
  const exact = new Map<string, string>();
  const alternatives = new Map<string, Set<string>>();
  const wordEvidence = new Map<string, Map<string, {songs: Set<number>; contexts: Set<string>}>>();

  // Songs are provided newest first. The first approved spelling wins for an exact source line.
  for (const song of songs) {
    const parsed = LyricsV2Schema.safeParse(song.lyricsV2);
    if (!parsed.success) continue;
    for (const entry of parsed.data.entries) {
      if (entry.kind !== "line") continue;
      const burmese = normalize(entry.burmese);
      const romanized = normalize(entry.romanized);
      if (!burmese || !romanized) continue;
      if (!exact.has(burmese)) exact.set(burmese, romanized);
      const variant = alternatives.get(burmese) ?? new Set<string>();
      variant.add(romanized);
      alternatives.set(burmese, variant);

      const words = burmeseWords(burmese);
      const tokens = romanizedTokens(romanized).map(match => match[0]);
      // Never assume alignment when token counts differ or English appears in the source.
      if (words.length < 2 || words.length !== tokens.length || /[A-Za-z]/u.test(burmese)) continue;
      for (let i = 0; i < words.length; i++) {
        const variants = wordEvidence.get(words[i]) ?? new Map<string, {songs: Set<number>; contexts: Set<string>}>();
        const evidence = variants.get(tokens[i].toLowerCase()) ?? {songs: new Set<number>(), contexts: new Set<string>()};
        evidence.songs.add(song.mmid);
        evidence.contexts.add(burmese);
        variants.set(tokens[i].toLowerCase(), evidence);
        wordEvidence.set(words[i], variants);
      }
    }
  }

  const dictionary = new Map<string, string>();
  for (const [word, variants] of wordEvidence) {
    const counts = [...variants].map(([spelling, evidence]) => ({spelling, count: evidence.songs.size, contexts: evidence.contexts.size}));
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    counts.sort((a, b) => b.count - a.count);
    // Require three distinct songs, two contexts and >=90% agreement.
    if (counts[0]?.count >= 3 && counts[0].contexts >= 2 && counts[0].count / total >= 0.9) dictionary.set(word, counts[0].spelling);
  }

  const changes: RefinementChange[] = [];
  const ambiguousLines: number[] = [];
  const lines = generated.map((line, position) => {
    const input = source[position];
    if (!input || input.index !== line.index || !input.text.trim()) return line;
    const key = normalize(input.text);
    const known = exact.get(key);
    if (known) {
      if ((alternatives.get(key)?.size ?? 0) > 1) ambiguousLines.push(line.index);
      if (known !== line.text) changes.push({index: line.index, kind: "exact-line", original: line.text, corrected: known});
      return {...line, text: known};
    }

    const words = burmeseWords(key);
    const tokens = romanizedTokens(line.text);
    if (words.length < 3 || words.length !== tokens.length || /[A-Za-z]/u.test(key)) return line;
    const aligned = words.filter((word, i) => dictionary.has(word) && dictionary.get(word) === tokens[i][0].toLowerCase()).length;
    // Two already-correct positions anchor the order; apply at most one inferred word correction.
    const mismatches = words.map((word, i) => ({i, suggested: dictionary.get(word)}))
      .filter(({i, suggested}) => suggested && suggested !== tokens[i][0].toLowerCase());
    if (aligned < 2 || mismatches.length !== 1) return line;
    const [{i, suggested}] = mismatches;
    const match = tokens[i];
    const replacement = match[0][0] === match[0][0].toUpperCase() && i === 0
      ? suggested![0].toUpperCase() + suggested!.slice(1) : suggested!;
    const refined = line.text.slice(0, match.index) + replacement + line.text.slice(match.index! + match[0].length);
    if (refined !== line.text) changes.push({index: line.index, kind: "word", original: line.text, corrected: refined});
    return {...line, text: refined};
  });
  return {lines, changes, ambiguousLines};
}
