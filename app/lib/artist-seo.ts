import type { ArtistEntity } from "@/modules/artists/domain/artist.types";
import { jsonLdScriptValue } from "@/app/lib/song-seo";

const ORIGIN = "https://www.romanizedmm.com";

export function artistSeo(artist: ArtistEntity, locale: string) {
  const url = (lang: string) => `${ORIGIN}/${lang}/artist/${encodeURIComponent(artist.slug)}`;
  const canonical = url(locale);
  const description = artist.biography?.trim()
    ? `${artist.name} — ${artist.biography.trim().slice(0, 155)}`
    : `Discover ${artist.name}, a Myanmar music artist, and explore their songs on RomanizedMM.`;
  const socials = artist.socials
    ? [artist.socials.facebook, artist.socials.instagram, artist.socials.youtube, artist.socials.spotify, artist.socials.appleMusic]
      .filter((value): value is string => typeof value === "string" && /^https:\/\//.test(value))
    : [];
  const entity = {
    "@context": "https://schema.org",
    "@type": artist.type?.toLowerCase() === "band" ? "MusicGroup" : "Person",
    "@id": `${url("en")}#artist`,
    name: artist.name,
    url: canonical,
    ...(artist.biography ? { description: artist.biography } : {}),
    ...(artist.imageLink ? { image: artist.imageLink } : {}),
    ...(artist.musicGenre?.length ? { genre: artist.musicGenre } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  };
  return {
    title: artist.name,
    description,
    canonical,
    alternateLanguages: { en: url("en"), my: url("my") },
    entity,
  };
}

export { jsonLdScriptValue };
