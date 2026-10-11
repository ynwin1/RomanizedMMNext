import type { MetadataRoute } from "next";
import type { SitemapSongRecord } from "@/modules/songs/application/song.dto";
import { songSeo } from "@/app/lib/song-seo";

export interface SitemapArtistRecord { slug: string }

const SITE = "https://www.romanizedmm.com";
const LANGUAGES = ["en", "my"] as const;

/** Only canonical, indexable URLs. No state-only ?option= variants. */
export function buildPublicSitemap(songs: SitemapSongRecord[], artists: SitemapArtistRecord[] = []): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];
  for (const locale of LANGUAGES) {
    for (const path of ["", "/about", "/song-catalogue", "/song-request", "/artist-catalogue", "/playlists"]) {
      routes.push({
        url: `${SITE}/${locale}${path}`,
        alternates: { languages: Object.fromEntries(LANGUAGES.map(lang => [lang, `${SITE}/${lang}${path}`])) },
      });
    }
  }
  const seen = new Set<number>();
  for (const song of songs) {
    if (!Number.isSafeInteger(song.mmid) || song.mmid <= 0 || seen.has(song.mmid)) continue;
    seen.add(song.mmid);
    for (const locale of LANGUAGES) {
      const seo = songSeo({ ...song, artistName: [] }, locale);
      const updatedAt = song.updatedAt instanceof Date && !Number.isNaN(song.updatedAt.getTime()) && song.updatedAt.getTime() <= Date.now()
        ? song.updatedAt : undefined;
      routes.push({
        url: seo.canonical,
        ...(updatedAt ? { lastModified: updatedAt } : {}),
        alternates: { languages: seo.alternateLanguages },
      });
    }
  }
  const artistSlugs = new Set<string>();
  for (const artist of artists) {
    const slug = artist.slug?.trim();
    if (!slug || artistSlugs.has(slug)) continue;
    artistSlugs.add(slug);
    const encoded = encodeURIComponent(slug);
    const alternates = { en: `${SITE}/en/artist/${encoded}`, my: `${SITE}/my/artist/${encoded}` };
    for (const locale of LANGUAGES) {
      routes.push({ url: alternates[locale], alternates: { languages: alternates } });
    }
  }
  return routes;
}
