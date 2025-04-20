"use server";
import { z } from "zod";
import {redirect} from "next/navigation";
import SongRequest from "@/app/model/SongRequest";
import connectDB from "@/app/lib/mongodb";
import TriviaScore from "@/app/model/TriviaScore";
import {countryFlags} from "@/app/lib/utils";
import Song from "@/app/model/Song";

const SongRequestForm = z.object({
    songName: z.string().min(1, { message: "Song Name is required." }),
    artist: z.string().min(1, { message: "Artist is required." }),
    youtubeLink: z.string().optional(),
    details: z.string().optional(),
    notifyEmail: z.string().email({ message: "Invalid email address." }).optional(),
}).refine((data) => {
    if (data.notifyEmail && !data.notifyEmail.includes('@')) {
        return false;
    }
    return true;
}, { message: "Please enter a valid email address." });

export type State = {
    errors? : {
        songName?: string[];
        artist?: string[];
        youtubeLink?: string[];
        details?: string[];
        notifyEmail?: string[];
    };
    message?: string;
}

export type ReportState = {
    errors? : {
        songName?: string[];
        artist?: string[];
        details?: string[];
    };
    message?: string;
}

const SongReportForm = z.object({
    songName: z.string().min(1, { message: "Song Name is required." }),
    artist: z.string().min(1, { message: "Artist is required." }),
    details: z.string().min(1, { message: "Details required." })
});

export type TriviaScoreState = {
    errors? : {
        userName?: string[];
        country?: string[];
        score?: string[];
    };
    message?: string;
}

const TriviaScoreForm = z.object({
    userName: z.string().min(1, { message: "Name is required." }).max(15, { message: "Max 15 characters."}),
    country: z.string().min(1, { message: "Country is required." }),
    score: z.number().min(1, { message: "Score is required." })
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
        details: formData.get("details") as string,
        notifyEmail: formData.get("notifyEmail") as string,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields, Failed to Create Invoice."
        };
    }

    const { songName, artist, youtubeLink, details, notifyEmail } = validatedFields.data;

    const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;
    if (!discordWebhook) {
        return {
            message: "Discord webhook URL is not set"
        };
    }

    let redirectPath: string | null = null;

    let message = "";

    // Create a new song request
    try {
        await connectDB();
        await SongRequest.create({
            songName,
            artist,
            youtubeLink,
            details,
            notifyEmail
        });

        const discordMessage = {
            content: `Song Name: ${songName}\nArtist: ${artist}\nYouTube Link: ${youtubeLink}\nDetails: ${details}\nNotify Email: ${notifyEmail}`
        };
        await sendToDiscord(discordWebhook, discordMessage);
        message = "Song request submitted successfully";
        redirectPath = `/${locale}/song-request/success`;
    } catch (error) {
        console.error(`Error is = ${error}`);
        message = "Failed to submit song request. Please try again!";
        redirectPath = `/${locale}/song-request/error`;
    } finally {
        if (redirectPath) {
            redirect(redirectPath);
        }
    }

    const resp: State = { message, errors: {} };
    return resp;
}

export async function createSongReport(prevState: ReportState, formData: FormData) {
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
        return { message: "Report submitted successfully ✅" };
    } catch (error) {
        console.log(`Error when submitting report - ${(error as Error).message}`);
        return { message: "Failed to submit report ❌. Please try again later!" };
    }
}

export async function createTriviaScore(prevState: TriviaScoreState, formData: FormData) {
    const validatedFields = TriviaScoreForm.safeParse({
        userName: formData.get("userName"),
        country: formData.get("country"),
        score: parseInt(formData.get("score") as string)
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors,
            message: "Please fill out all the required fields. Try Again!"
        };
    }

    const { userName, country, score } = validatedFields.data;
    try {
        await saveScoreAction(userName, country, score);
        const resp: TriviaScoreState = { message: "Score saved successfully" };
        return resp;
    } catch (error) {
        console.error(`Error when saving score - ${(error as Error).message}`);
        const resp: TriviaScoreState = { message: "Failed to save score. Please try again!", errors: {} };
        return resp;
    }
}

export async function fetchSongRequests() {
    try {
        await connectDB();
        return await SongRequest.find().select("songName artist -_id").lean();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function findMinimumTriviaScore() {
    try {
        await connectDB();
        const result = await TriviaScore.find().sort({ score: 1 }).limit(1).lean();
        if (result.length === 0) {
            return 0;
        }
        return result[0].score;
    } catch (error) {
        console.error(error);
        return 0;
    }
}

export async function fetchAllTriviaScores() {
    try {
        await connectDB();
        const scores = await TriviaScore.find().sort({ score: -1 }).lean(); // sort by score in descending order
        return scores.map(score => ({
            ...score,
            _id: score._id.toString(),
        }));
    } catch (error) {
        console.error("Error fetching Trivia Scores - " + error);
        return [];
    }
}

// for usage in sitemap.ts
export async function getAllSongs() {
    try {
        await connectDB();
        const songs = await Song.find().select("mmid songName -_id").lean();
        const songList = songs.map(song => ({
            mmid: song.mmid,
            songName: song.songName.split("(")[0].trim().replace(/\s/g, "")
        }))
        return songList;
    } catch (e) {
        console.error("Error getting all songs - ", e);
        return null;
    }
}

export async function saveScoreAction(userName: string, country: string, score: number) {
    try {
        await connectDB();

        const emoji = countryFlags[country] || '🌎';

        await TriviaScore.create({
            userName: userName,
            country: emoji,
            score: score
        });

        // remove the lowest score if there are more than 10 scores
        const allScores = await fetchAllTriviaScores();
        if (allScores.length > 10) {
            await TriviaScore.deleteOne({ _id: allScores[allScores.length - 1]._id });
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to save score:', error);
        return { success: false };
    }
}
