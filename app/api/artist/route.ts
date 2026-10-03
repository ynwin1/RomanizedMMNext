import { z } from "zod";
import { artistService } from "@/modules/artists";
import { logger } from "@/infrastructure/logging/logger";
import { zodFieldErrors } from "@/shared/write/validated-write";

export async function POST(req: Request) {
  let formData: unknown;

  try {
    formData = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const artist = await artistService.createArtist(formData);
    return Response.json({
      artist: {
        _id: artist.id,
        ...artist,
        id: undefined,
        __v: 0,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid artist", fields: zodFieldErrors(error) }, { status: 400 });
    }
    logger.error("Failed to create artist", error);
    return Response.json({ error: "Failed to create artist" }, { status: 500 });
  }
}
