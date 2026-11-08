import { songCoverService } from "@/modules/songs";
import { CoverConflictError, CoverNotFoundError } from "@/modules/songs/application/song-cover.service";
import { CoverSongIdSchema, SuggestCoverSchema } from "@/modules/songs/application/song-cover.validation";
import { logger } from "@/infrastructure/logging/logger";

export async function POST(request: Request, context: { params: Promise<{ mmid: string }> }) {
  const { mmid: rawId } = await context.params;
  if (!/^\d+$/.test(rawId)) return Response.json({ error: "Invalid song ID" }, { status: 400 });
  const parsedId = CoverSongIdSchema.safeParse(rawId);
  if (!parsedId.success) return Response.json({ error: "Invalid song ID" }, { status: 400 });

  // Avoid large anonymous payloads; never accept admin-controlled fields from visitors.
  if (Number(request.headers.get("content-length")) > 4096) {
    return Response.json({ error: "Submission is too large" }, { status: 413 });
  }
  const body = await request.text();
  if (body.length > 4096) return Response.json({ error: "Submission is too large" }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(body); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = SuggestCoverSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Invalid cover submission" }, { status: 400 });

  try {
    await songCoverService.suggest(parsedId.data, parsed.data);
    return Response.json({ message: "Suggestion submitted for review" }, { status: 201 });
  } catch (error) {
    if (error instanceof CoverConflictError) {
      return Response.json({ error: "This video has already been suggested for this song" }, { status: 409 });
    }
    if (error instanceof CoverNotFoundError) {
      return Response.json({ error: "Song not found" }, { status: 404 });
    }
    logger.error("Failed to submit song cover suggestion", error);
    return Response.json({ error: "Unable to submit cover suggestion" }, { status: 500 });
  }
}
