"use server";
import { z } from "zod";
import {redirect} from "next/navigation";
import SongRequest from "@/app/model/SongRequest";
import connectDB from "@/app/lib/mongodb";
import TriviaScore from "@/app/model/TriviaScore";

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

export type TriviaScoreState = {
    errors? : {
        userName?: string[];
        country?: string[];
        score?: string[];
    };
    message?: string | null;
}

const TriviaScoreForm = z.object({
    userName: z.string().min(1, { message: "Name is required." }),
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
    console.log(`userName: ${userName}, country: ${country}, score: ${score}`);

    try {
        await saveScoreAction(userName, country, score);
        return { message: "Score saved successfully" };
    } catch (error) {
        console.error(`Error when saving score - ${(error as Error).message}`);
        return { message: "Failed to save score. Please try again!" };
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
        console.log("Finding min trivia score");
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
        console.log("Fetching all trivia scores");
        return await TriviaScore.find().sort({ score: -1 }).lean(); // sort by score in descending order
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function saveScoreAction(userName: string, country: string, score: number) {
    try {
        await connectDB();
        console.log("Saving score action");
        await TriviaScore.create({
            userName,
            country,
            score
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

