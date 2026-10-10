import type { SongArtist } from "@/modules/songs/domain/song.types";

const ORIGIN = "https://www.romanizedmm.com";
const BURMESE = /[\u1000-\u109f\uaa60-\uaa7f]/u;

export interface SongSeoInput {
  mmid: number;
  songName: string;
  artistName: SongArtist[];
  about?: string;
  burmese?: string;
  genre?: string;
  albumName?: string;
  spotifyLink?: string;
  appleMusicLink?: string;
  youtubeLink?: string[];
}

export function songSeo(input: SongSeoInput, locale: string) {
  const splitAt = input.songName.indexOf("(");
  const romanized = (splitAt === -1 ? input.songName : input.songName.slice(0, splitAt)).trim();
  const alternate = splitAt === -1 ? "" : input.songName.slice(splitAt + 1).replace(/\)\s*$/, "").trim();
  const burmese = BURMESE.test(alternate) ? alternate : "";
  const names = burmese ? `${burmese} (${romanized})` : romanized;
  const artists = input.artistName.map(artist => artist.name).filter(Boolean);
  const artistText = artists.join(", ");
  const title = `${names} Lyrics - ${artistText}`;
  const description = locale === "my" && burmese
    ? `${burmese} (${romanized}) သီချင်းစာသား၊ Romanized lyrics နှင့် English meaning ကို RomanizedMM တွင် ဖတ်ရှုနိုင်ပါသည်။ ${artistText}။`
    : `${names} lyrics by ${artistText}. Read Burmese lyrics, Romanized pronunciation, and English meaning on RomanizedMM.`;
  const excerpt = input.burmese?.replace(/\s+/g, " ").trim().slice(0, 90);
  const enrichedDescription = excerpt ? `${description} ${excerpt}` : description;
  const slug = romanized.replace(/\s/g, "");
  const url = (language: string) => `${ORIGIN}/${language}/song/${encodeURIComponent(slug)}/${input.mmid}`;
  const canonical = url(locale);
  const alternateLanguages = { en: url("en"), my: url("my") };
  const recording = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: names,
    alternateName: [romanized, burmese].filter(Boolean),
    byArtist: artists.map(name => ({ "@type": "MusicGroup", name })),
    ...(input.albumName ? { inAlbum: { "@type": "MusicAlbum", name: input.albumName } } : {}),
    ...(input.genre ? { genre: input.genre } : {}),
    ...(input.about ? { description: input.about } : {}),
    url: canonical,
    sameAs: [input.youtubeLink?.[0], input.spotifyLink, input.appleMusicLink].filter(Boolean),
  };
  return { title, description: enrichedDescription, canonical, alternateLanguages, recording, names };
}

export function jsonLdScriptValue(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
