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

export type ReportState = {
    errors? : {
        songName?: string[];
        artist?: string[];
        details?: string[];
    };
    message?: string | null;
}

const SongReportForm = z.object({
    songName: z.string().min(1, { message: "Song Name is required." }),
    artist: z.string().min(1, { message: "Artist is required." }),
    details: z.string().min(1, { message: "Details required." })
});

async function sendToDiscord(webhookUrl: string, message: any) {
    const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    });

    if (!resp.ok) {
        throw new Error('Failed to send song request/report to Discord!');
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

    let redirectPath: string | null = null;

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

        redirectPath = `/${locale}/song-request/success`;
    } catch (error) {
        console.error(`Error is = ${error}`);
        redirectPath = `/${locale}/song-request/error`;
    } finally {
        if (redirectPath) {
            redirect(redirectPath);
        }
    }
}

export async function createSongReport(locale: string, prevState: ReportState, formData: FormData) {
    const validatedFields = SongReportForm.safeParse({
        songName: formData.get("songName"),
        artist: formData.get("artist"),
        details: formData.get("details")
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors,
            message: "Please fill out all the required fields. Try Again!"
        };
    }

    const { songName, artist, details } = validatedFields.data;

    const discordWebhook = process.env.DISCORD_SONG_REPORT_WEBHOOK;
    if (!discordWebhook) {
        return {
            message: "Discord webhook URL is not set"
        };
    }

    try {
        const discordMessage = {
            content: `Song Name: ${songName}\nArtist: ${artist}\nDetails: ${details}`
        };
        await sendToDiscord(discordWebhook, discordMessage);

        // return success message no redirect
        return { message: "Report submitted successfully" };
    } catch (error) {
        console.log(`Error when submitting report - ${(error as Error).message}`);
        return { message: "Failed to submit report. Please try again!" };
    }
}

export async function fetchSongRequests() {
    try {
        await connectDB();
        const resp = await SongRequest.find().select("songName artist -_id").lean();
        return resp;
    } catch (error) {
        console.error(error);
        return [];
    }
}

