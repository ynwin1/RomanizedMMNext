import type { LyricsV2 } from "@/modules/songs/domain/lyrics-v2.types";
import type { LyricTimingTrack } from "@/modules/songs/domain/lyric-timing.types";

export function syncedEntries(lyrics: LyricsV2, option: string) {
  return lyrics.entries.map((entry, entryIndex) => ({
    entryIndex, text: entry.kind === "break" ? "" :
      option === "romanized" ? entry.romanized : option === "meaning" ? (entry.meaning ?? "") : entry.burmese,
    isBreak: entry.kind === "break",
  }));
}

export function activeSyncedEntry(track: LyricTimingTrack | null, currentMs: number): number | null {
  return track?.lines.find(line => currentMs >= line.startMs && currentMs < line.endMs)?.entryIndex ?? null;
}
