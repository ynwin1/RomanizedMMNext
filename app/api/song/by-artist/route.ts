import { songService } from "@/modules/songs";
import { logger } from "@/infrastructure/logging/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");

  if (!artist) {
    return Response.json({ error: "No artist provided" }, { status: 400 });
  }

  try {
    const songs = (await songService.getSongsByArtistName(artist)).map(({ id, ...song }) => ({
      _id: id,
      ...song,
    }));

    return Response.json({ success: true, songs });
  } catch (error) {
    logger.error("Failed to fetch songs by artist", error);
    return Response.json({ error: "Failed to fetch songs by artist" }, { status: 500 });
  }
}
