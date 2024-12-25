import SongRequest from "@/app/model/SongRequest";
import connectDB from "@/app/lib/mongodb";

async function sendToDiscord(webhookUrl: string, message: any) {
    const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    });

    if (!resp.ok) {
        throw new Error('Failed to send song request to Discord!');
    }
}

export async function POST(req: Request) {
    const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;

    if (!discordWebhook) {
        return Response.json({ error: 'Discord webhook URL is not set' }, { status: 500 });
    }

    try {
        await connectDB();
        const formData = await req.json();
        const discordMessage = {
            content: `Song Name: ${formData.songName}\nArtist: ${formData.artist}\nYouTube Link: ${formData.youtubeLink}\nDetails: ${formData.details}`
        };

        const songRequest = await SongRequest.create(formData);
        await sendToDiscord(discordWebhook, discordMessage);

        return Response.json({ songRequest }, { status: 201 });
    } catch (error) {
        return Response.json({ error: `Failed to create song request with error - ${error}` }, { status: 500 });
    }
}

