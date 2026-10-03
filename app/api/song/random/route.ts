import { songService } from "@/modules/songs";
import { logger } from "@/infrastructure/logging/logger";

export async function GET() {
  try {
    const song = await songService.getRandomSong();

    if (!song) {
      return Response.json({ error: "No songs found" }, { status: 404 });
    }

    return Response.json({ success: true, data: song });
  } catch (error) {
    logger.error("Failed to fetch random song", error);
    return Response.json({ error: "Failed to fetch random song" }, { status: 500 });
  }
}
