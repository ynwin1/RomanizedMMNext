import type { LyricsV2 } from "./lyrics-v2.types";
import type { SongEntity } from "./song.types";

export interface CanonicalLyricsText {
  burmese: string;
  romanized: string;
  meaning: string;
  source: "v2" | "legacy";
}

export function renderLyricsV2Column(
  lyrics: LyricsV2,
  column: "burmese" | "romanized" | "meaning",
): string {
  return lyrics.entries.map(entry => {
    if (entry.kind === "break") return "";
    if (column === "meaning") return entry.meaning ?? "";
    return entry[column];
  }).join("\n");
}

export function legacyLyricsFromV2(lyrics: LyricsV2): Pick<CanonicalLyricsText, "burmese" | "romanized" | "meaning"> & { lyrics: string } {
  const burmese = renderLyricsV2Column(lyrics, "burmese");
  return {
    lyrics: burmese,
    burmese,
    romanized: renderLyricsV2Column(lyrics, "romanized"),
    meaning: renderLyricsV2Column(lyrics, "meaning"),
  };
}

export function getCanonicalLyrics(song: Pick<SongEntity, "burmese" | "romanized" | "meaning" | "lyricsV2">): CanonicalLyricsText {
  if (!song.lyricsV2) {
    return {
      burmese: song.burmese,
      romanized: song.romanized,
      meaning: song.meaning,
      source: "legacy",
    };
  }

  return {
    burmese: renderLyricsV2Column(song.lyricsV2, "burmese"),
    romanized: renderLyricsV2Column(song.lyricsV2, "romanized"),
    meaning: renderLyricsV2Column(song.lyricsV2, "meaning"),
    source: "v2",
  };
}

export function withCanonicalLyrics<T extends Pick<SongEntity, "burmese" | "romanized" | "meaning" | "lyricsV2">>(
  song: T,
): T {
  const lyrics = getCanonicalLyrics(song);
  return {
    ...song,
    burmese: lyrics.burmese,
    romanized: lyrics.romanized,
    meaning: lyrics.meaning,
  };
}
