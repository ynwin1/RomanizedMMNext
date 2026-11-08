import { songCoverService } from "@/modules/songs";
import { CoverSongIdSchema } from "@/modules/songs/application/song-cover.validation";
import { logger } from "@/infrastructure/logging/logger";
import { publicCoverRecords } from "@/modules/songs/application/song-cover.public";

export async function GET(_request: Request, context: { params: Promise<{ mmid: string }> }) {
  const { mmid: rawId } = await context.params;
  if (!/^\d+$/.test(rawId)) {
    return Response.json({ error: "Invalid song ID" }, { status: 400 });
  }
  const parsed = CoverSongIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return Response.json({ error: "Invalid song ID" }, { status: 400 });
  }
  try {
    const covers = await songCoverService.approved(parsed.data);
    return Response.json({ covers: publicCoverRecords(covers) }, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    logger.error("Failed to load song covers", error);
    return Response.json({ error: "Unable to load covers" }, { status: 500 });
  }
}
