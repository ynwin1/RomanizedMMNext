import { z } from "zod";
import { parseYouTubeVideoId } from "./song-cover.youtube";

/** The public, optional metadata that can be collected without a YouTube API key. */
export interface YouTubeCoverMetadata {
  videoId: string;
  title: string;
  authorName?: string;
  thumbnailUrl: string;
}

const OEmbedResponseSchema = z.object({
  title: z.string().trim().min(1).max(500),
  author_name: z.string().trim().max(200).optional(),
}).passthrough();

/**
 * The remote URL is constructed ONLY from a validated video ID, never from the
 * submitted URL, so this cannot become a general-purpose URL fetching endpoint.
 */
export async function fetchYouTubeCoverMetadata(
  youtubeUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<YouTubeCoverMetadata | null> {
  const videoId = parseYouTubeVideoId(youtubeUrl);
  if (!videoId) return null;
  const canonical = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`;
  try {
    const response = await fetcher(endpoint, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
      redirect: "error",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = await response.text();
    if (body.length > 16_384) return null;
    const parsed = OEmbedResponseSchema.safeParse(JSON.parse(body) as unknown);
    if (!parsed.success) return null;
    return {
      videoId,
      title: parsed.data.title.slice(0, 200),
      ...(parsed.data.author_name ? { authorName: parsed.data.author_name } : {}),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    // Private, deleted, blocked or temporarily unreachable videos can still be
    // saved by the admin and reviewed manually.
    return null;
  }
}
