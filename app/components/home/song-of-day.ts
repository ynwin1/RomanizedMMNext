import type { SongCatalogueRecord } from "@/modules/songs/application/song.dto";

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/** A shuffled, repeat-free rotation until all current songs have been featured. */
export function songOfTheDayId(songs: SongCatalogueRecord[], now: Date): number | null {
  if (songs.length === 0) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yangon", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const dayNumber = Math.floor(Date.UTC(value("year"), value("month") - 1, value("day")) / 86400000);
  const shuffled = [...songs].sort((a, b) => hash(`RomanizedMM:${a.mmid}`) - hash(`RomanizedMM:${b.mmid}`) || a.mmid - b.mmid);
  return shuffled[dayNumber % shuffled.length].mmid;
}
