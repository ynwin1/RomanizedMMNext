import type { MetadataRoute } from "next";
import { songService, type SitemapSongRecord } from "@/modules/songs";
import { logger } from "@/infrastructure/logging/logger";
import { artistService } from "@/modules/artists";
import { buildPublicSitemap } from "@/app/lib/public-sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let songs: SitemapSongRecord[] = [];
  try {
    songs = await songService.getSitemapSongs();
  } catch (error) {
    logger.error("Failed to fetch songs for sitemap", error);
  }
  const artists: Array<{ slug: string }> = [];
  try {
    const limit = 500;
    const first = await artistService.getCatalogue(1, limit);
    artists.push(...first.artists);
    for (let page = 2; page <= first.totalPages; page++) {
      const next = await artistService.getCatalogue(page, limit);
      artists.push(...next.artists);
    }
  } catch (error) {
    logger.error("Failed to fetch artists for sitemap", error);
  }
  return buildPublicSitemap(songs, artists);
}
