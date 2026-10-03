"use server";
import { z } from "zod";
import {redirect} from "next/navigation";
import {countryFlags} from "@/app/lib/utils";
import {songService} from "@/modules/songs";
import { GameMode } from "@/app/lib/constants";
import {triviaService} from "@/modules/trivia";
import {songRequestService} from "@/modules/requests";
import {sendDiscordNotification} from "@/integrations/notifications/discord-notification.adapter";

const SongRequestForm = z.object({
    songName: z.string().min(1, { message: "Song Name is required." }),
    artist: z.string().min(1, { message: "Artist is required." }),
    youtubeLink: z.string().optional(),
    details: z.string().optional(),
    requestedBy: z.string().optional(),
    songStory: z.string().optional()
        .refine(
            (value) => !value || value.trim().split(/\s+/).length <= 50,
            { message: "50 words maximum" }
        ),
    notifyEmail: z
        .string()
        .optional()
        .transform((val) => (val === "" ? undefined : val))
        .pipe(z.string().email({ message: "Invalid email address." }).optional())
})

export type State = {
    errors? : {
        songName?: string[];
        artist?: string[];
        youtubeLink?: string[];
        details?: string[];
        requestedBy?: string[];
        songStory?: string[];
        notifyEmail?: string[];
    };
    message?: string;
}

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
    score: z.number().min(1, { message: "Score is required." }),
    gameMode: z.nativeEnum(GameMode, { message: "Game mode is required." })
});

export async function createSongRequest(locale: string, prevState: State, formData: FormData) {
    const validatedFields = SongRequestForm.safeParse({
        songName: formData.get("songName") as string,
        artist: formData.get("artist") as string,
        youtubeLink: formData.get("youtubeLink") as string,
        details: formData.get("details") as string,
        requestedBy: formData.get("requestedBy") as string,
        songStory: formData.get("songStory") as string,
        notifyEmail: formData.get("notifyEmail") as string,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields, Failed to Create Song Request."
        };
    }

    const {
        songName,
        artist,
        youtubeLink,
        details,
        requestedBy,
        songStory,
        notifyEmail
    } = validatedFields.data;

    const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;
    if (!discordWebhook) {
        return {
            message: "Discord webhook URL is not set"
        };
    }

    let redirectPath: string | null = null;

    let message = "";

    // Create a new song request
    const notProvided: string = "Not Provided";

    const email = notifyEmail ? notifyEmail : notProvided;
    const ytLink = youtubeLink ? youtubeLink : notProvided;
    const detailsText = details ? details : notProvided;
    const reqBy = requestedBy ? requestedBy : notProvided;
    const songStr = songStory ? songStory : notProvided;

    try {
        await songRequestService.create({
            songName,
            artist,
            youtubeLink: ytLink,
            details: detailsText,
            requestedBy: reqBy,
            songStory: songStr,
            notifyEmail: email
        });

        const discordMessage = {
            content: `Song Name: ${songName}\nArtist: ${artist}\nYouTube Link: ${ytLink}\nDetails: ${detailsText}\nRequested By: ${reqBy}\nSong Story: ${songStr}\nNotify Email: ${email}`
        };
        await sendDiscordNotification(discordWebhook, discordMessage);
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

export async function createTriviaScore(prevState: TriviaScoreState, formData: FormData) {
    const validatedFields = TriviaScoreForm.safeParse({
        userName: formData.get("userName"),
        country: formData.get("country"),
        score: parseInt(formData.get("score") as string),
        gameMode: formData.get("gameMode") as GameMode
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors,
            message: "Please fill out all the required fields. Try Again!"
        };
    }

    const { userName, country, score, gameMode } = validatedFields.data;
    try {
        await saveScoreAction(userName, country, score, gameMode);
        const resp: TriviaScoreState = { message: "Score saved successfully" };
        return resp;
    } catch (error) {
        console.error(`Error when saving score - ${(error as Error).message}`);
        const resp: TriviaScoreState = { message: "Failed to save score. Please try again!", errors: {} };
        return resp;
    }
}

export async function fetchAllTriviaScores(gameMode: GameMode) {
    try {
        const scores = await triviaService.getLeaderboard(gameMode);
        return scores.map(({ id, ...score }) => ({
            ...score,
            _id: id,
        }));
    } catch (error) {
        console.error("Error fetching Trivia Scores - " + error);
        return [];
    }
}

// for usage in sitemap.ts
export async function getAllSongs() {
    try {
        return await songService.getSitemapSongs();
    } catch (e) {
        console.error("Error getting all songs - ", e);
        return null;
    }
}

export async function fetchLastCreatedSongs(limit: number = 5) {
    try {
        return await songService.getLatestSongs(limit);
    } catch (error) {
        console.error("Error fetching last added songs:", error);
        return [];
    }
}

export async function saveScoreAction(
    userName: string,
    country: string,
    score: number,
    gameMode: GameMode
) {
    try {
        const emoji = countryFlags[country] || '🌎';

        await triviaService.saveScore({
            userName,
            country: emoji,
            score,
            gameMode,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to save score:', error);
        return { success: false };
    }
}
