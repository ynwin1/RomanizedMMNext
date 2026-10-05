import { songService } from "@/modules/songs";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { logger } from "@/infrastructure/logging/logger";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  props: Props,
) {
  const { id } = await props.params;
  const mmid = Number(id);

  if (!Number.isInteger(mmid) || mmid <= 0) {
    return Response.json({ error: "Invalid song id" }, { status: 400 });
  }

  try {
    const { id: songId, ...song } = await songService.getSongPage(mmid);
    return Response.json({ success: true, data: { _id: songId, ...song } });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ error: "Song not found" }, { status: 404 });
    }

    logger.error("Failed to fetch song by id", error);
    return Response.json({ error: "Failed to fetch song" }, { status: 500 });
  }
}
