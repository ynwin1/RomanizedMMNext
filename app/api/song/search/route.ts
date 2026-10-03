import { songService } from "@/modules/songs";
import { logger } from "@/infrastructure/logging/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return Response.json({ error: "No query provided" }, { status: 400 });
  }

  try {
    const songs = await songService.search(query);
    return Response.json({ success: true, songs });
  } catch (error) {
    logger.error("Failed to search songs", error);
    return Response.json({ error: "Failed to search songs" }, { status: 500 });
  }
}
