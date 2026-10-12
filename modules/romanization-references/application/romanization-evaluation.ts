import {refineRomanization} from "./romanization-refinement";
import type {RomanizationReferenceSong} from "./romanization-reference.types";
import {LyricsV2Schema} from "@/modules/songs/application/lyrics-v2.validation";

export type EvaluationSong = RomanizationReferenceSong & {updatedAt?: string | null};

const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s+/gu, " ");

/** Deterministic artificial typo, never presented as a real AI error sample. */
function seedError(value: string): string | null {
  const match = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/u.exec(value);
  if (!match || match.index === undefined) return null;
  return value.slice(0, match.index) + "zzerror" + value.slice(match.index + match[0].length);
}

export function evaluateRomanization(songs: EvaluationSong[], maxSongs = 100): {
  summary: {
    evaluatedSongs: number; evaluatedLines: number; referenceSongs: number;
    cleanChanged: number; cleanRegressions: number; cleanExactMatches: number;
    seededCases: number; seededRecovered: number; seededRegressions: number;
    exactLineChanges: number; wordChanges: number; conflicts: number;
  };
  perSong: Array<{mmid: number; lines: number; cleanRegressions: number; seededRecovered: number; seededCases: number}>;
} {
  if (!Number.isSafeInteger(maxSongs) || maxSongs < 1 || maxSongs > 1000) throw new Error("maxSongs must be between 1 and 1000");
  const valid = songs.flatMap(song => {
    // R1 deliberately omits "meaning" from its private export. Restore a null
    // placeholder for validation and refinement without exporting new data.
    const serialized = song.lyricsV2 as {version?: unknown; entries?: unknown};
    const entries = Array.isArray(serialized?.entries) ? serialized.entries.map(entry =>
      entry?.kind === "line" && entry.meaning === undefined ? {...entry, meaning: null} : entry) : null;
    const lyrics = LyricsV2Schema.safeParse({version: serialized?.version, entries});
    return lyrics.success && Number.isSafeInteger(song.mmid) && song.mmid >= 0
      ? [{song: {...song, lyricsV2: lyrics.data}, lyrics: lyrics.data}] : [];
  });
  const unique = new Map<number, (typeof valid)[number]>();
  for (const item of valid) {
    if (unique.has(item.song.mmid)) throw new Error(`Duplicate song ID ${item.song.mmid}`);
    unique.set(item.song.mmid, item);
  }
  const sorted = [...unique.values()].sort((a, b) => b.song.mmid - a.song.mmid);
  const sample = sorted.slice(0, maxSongs);
  const summary = {evaluatedSongs: 0, evaluatedLines: 0, referenceSongs: sorted.length, cleanChanged: 0,
    cleanRegressions: 0, cleanExactMatches: 0, seededCases: 0, seededRecovered: 0,
    seededRegressions: 0, exactLineChanges: 0, wordChanges: 0, conflicts: 0};
  const perSong = [];
  for (const target of sample) {
    // Exclude the ENTIRE test song; do not let its other repeated lines leak into training.
    const refs = sorted.filter(item => item.song.mmid !== target.song.mmid).slice(0, 500).map(item => item.song);
    const lines = target.lyrics.entries.flatMap((entry, index) => entry.kind === "line" &&
      normalize(entry.burmese) && normalize(entry.romanized)
      ? [{index, burmese: entry.burmese, romanized: entry.romanized}] : []);
    if (lines.length === 0) continue;
    summary.evaluatedSongs++;
    const source = lines.map(line => ({index: line.index, text: line.burmese}));
    const gold = lines.map(line => ({index: line.index, text: line.romanized}));
    const clean = refineRomanization(source, gold, refs);
    const cleanRegressions = clean.lines.filter((line, i) => normalize(line.text) !== normalize(gold[i].text)).length;
    summary.evaluatedLines += lines.length;
    summary.cleanChanged += clean.changes.length;
    summary.cleanRegressions += cleanRegressions;
    summary.cleanExactMatches += lines.length - cleanRegressions;
    summary.exactLineChanges += clean.changes.filter(change => change.kind === "exact-line").length;
    summary.wordChanges += clean.changes.filter(change => change.kind === "word").length;
    summary.conflicts += clean.ambiguousLines.length;

    const seeded = gold.map(line => ({...line, text: seedError(line.text) ?? line.text}));
    const applicable = seeded.map((line, index) => line.text !== gold[index].text);
    const corrected = refineRomanization(source, seeded, refs);
    let recovered = 0;
    let seededCases = 0;
    for (let i = 0; i < gold.length; i++) {
      if (!applicable[i]) continue;
      seededCases++;
      if (normalize(corrected.lines[i].text) === normalize(gold[i].text)) recovered++;
      // Do not double-count typos still present as regressions; count *additional* changes
      // only when the output differs from both the seeded input and the reviewed target.
      else if (normalize(corrected.lines[i].text) !== normalize(seeded[i].text)) summary.seededRegressions++;
    }
    summary.seededCases += seededCases;
    summary.seededRecovered += recovered;
    perSong.push({mmid: target.song.mmid, lines: lines.length, cleanRegressions, seededRecovered: recovered, seededCases});
  }
  return {summary, perSong};
}
