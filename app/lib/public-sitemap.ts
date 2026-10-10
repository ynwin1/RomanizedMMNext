import type { MetadataRoute } from "next";
import type { SitemapSongRecord } from "@/modules/songs/application/song.dto";
import { songSeo } from "@/app/lib/song-seo";

const SITE = "https://www.romanizedmm.com";
const LANGUAGES = ["en", "my"] as const;

/** Only canonical, indexable URLs. No state-only ?option= variants. */
export function buildPublicSitemap(songs: SitemapSongRecord[]): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];
  for (const locale of LANGUAGES) {
    for (const path of ["", "/about", "/song-catalogue", "/song-request"]) {
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
      routes.push({
        url: seo.canonical,
        alternates: { languages: seo.alternateLanguages },
      });
    }
  }
  return routes;
}
