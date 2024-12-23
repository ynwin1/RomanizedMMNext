"use server";
import { z } from "zod";
import {redirect} from "next/navigation";
import SongRequest from "@/app/model/SongRequest";
import connectDB from "@/app/lib/mongodb";

const SongRequestForm = z.object({
    songName: z.string().min(1, { message: "Song Name is required." }),
    artist: z.string().min(1, { message: "Artist is required." }),
    youtubeLink: z.string().optional(),
    details: z.string().optional()
});

export type State = {
    errors? : {
        songName?: string[];
        artist?: string[];
        youtubeLink?: string[];
        details?: string[];
    };
    message?: string | null;
}

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

export async function createSongRequest(locale: string, prevState: State, formData: FormData) {
    const validatedFields = SongRequestForm.safeParse({
        songName: formData.get("songName") as string,
        artist: formData.get("artist") as string,
        youtubeLink: formData.get("youtubeLink") as string,
        details: formData.get("details") as string
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields, Failed to Create Invoice."
        };
    }

    const { songName, artist, youtubeLink, details } = validatedFields.data;

    const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;
    if (!discordWebhook) {
        return {
            message: "Discord webhook URL is not set"
        };
    }

    // Create a new song request
    try {
        await connectDB();
         await SongRequest.create({
            songName,
            artist,
            youtubeLink,
            details
        });

        const discordMessage = {
            content: `Song Name: ${songName}\nArtist: ${artist}\nYouTube Link: ${youtubeLink}\nDetails: ${details}`
        };
        await sendToDiscord(discordWebhook, discordMessage);

        redirect(`/${locale}/song-requests/success`);
    } catch (error) {
        console.error(error);
        redirect(`/${locale}/song-requests/error`);
    }
}

export async function fetchSongRequests() {
    try {
        await connectDB();
        const resp = await SongRequest.find().select("songName artist").lean();
        return resp;
    } catch (error) {
        console.error(error);
        return [];
    }
}

