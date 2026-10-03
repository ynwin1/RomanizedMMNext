import { songRequestService, SongRequestInputSchema } from "@/modules/requests";
import { sendDiscordNotification } from "@/integrations/notifications/discord-notification.adapter";

export async function POST(req: Request) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const validatedFields = SongRequestInputSchema.safeParse(payload);

  if (!validatedFields.success) {
    return Response.json(
      {
        error: "Invalid song request",
        fields: validatedFields.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const formData = validatedFields.data;
    const songRequest = await songRequestService.create(formData);

    const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;
    if (discordWebhook) {
      try {
        await sendDiscordNotification(discordWebhook, {
          content: `Song Name: ${formData.songName}\nArtist: ${formData.artist}\nYouTube Link: ${formData.youtubeLink}\nDetails: ${formData.details}`,
        });
      } catch (error) {
        console.error("Failed to send song request notification to Discord:", error);
      }
    }

    const { id, ...requestData } = songRequest;
    return Response.json(
      { songRequest: { _id: id, ...requestData } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create song request:", error);
    return Response.json(
      { error: "Failed to create song request" },
      { status: 500 },
    );
  }
}
