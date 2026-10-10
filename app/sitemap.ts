import type { MetadataRoute } from "next";
import { songService, type SitemapSongRecord } from "@/modules/songs";
import { logger } from "@/infrastructure/logging/logger";
import { buildPublicSitemap } from "@/app/lib/public-sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let songs: SitemapSongRecord[] = [];
  try {
    songs = await songService.getSitemapSongs();
  } catch (error) {
    logger.error("Failed to fetch songs for sitemap", error);
  }
  return buildPublicSitemap(songs);
}
