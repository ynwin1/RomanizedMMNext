import { z } from "zod";
import { songRequestService, SongRequestInputSchema } from "@/modules/requests";
import { sendDiscordNotification } from "@/integrations/notifications/discord-notification.adapter";
import { logger } from "@/infrastructure/logging/logger";
import { zodFieldErrors } from "@/shared/write/validated-write";

export async function POST(req: Request) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = SongRequestInputSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid song request", fields: zodFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const formData = parsed.data;
    const songRequest = await songRequestService.create(formData);

    const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;
    if (discordWebhook) {
      try {
        await sendDiscordNotification(discordWebhook, {
          content: `Song Name: ${formData.songName}\nArtist: ${formData.artist}\nYouTube Link: ${formData.youtubeLink}\nDetails: ${formData.details}`,
        });
      } catch {
        logger.warn("Song request persisted but Discord notification failed");
      }
    }

    const { id, ...requestData } = songRequest;
    return Response.json(
      { songRequest: { _id: id, ...requestData } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid song request", fields: zodFieldErrors(error) }, { status: 400 });
    }
    logger.error("Failed to create song request", error);
    return Response.json({ error: "Failed to create song request" }, { status: 500 });
  }
}
