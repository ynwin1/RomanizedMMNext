import {songRequestService, CreateSongRequestInput} from "@/modules/requests";
import {sendDiscordNotification} from "@/integrations/notifications/discord-notification.adapter";

export async function POST(req: Request) {
    const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;

    if (!discordWebhook) {
        return Response.json({ error: 'Discord webhook URL is not set' }, { status: 500 });
    }

    try {
        const formData = await req.json() as CreateSongRequestInput;
        const discordMessage = {
            content: `Song Name: ${formData.songName}\nArtist: ${formData.artist}\nYouTube Link: ${formData.youtubeLink}\nDetails: ${formData.details}`
        };

        const songRequest = await songRequestService.create(formData);
        await sendDiscordNotification(discordWebhook, discordMessage);

        const { id, ...requestData } = songRequest;
        return Response.json({ songRequest: { _id: id, ...requestData } }, { status: 201 });
    } catch (error) {
        return Response.json({ error: `Failed to create song request with error - ${error}` }, { status: 500 });
    }
}

