"use server";
import { z } from "zod";
import {redirect} from "next/navigation";
import SongRequest from "@/app/model/SongRequest";
import connectDB from "@/app/lib/mongodb";

const SongRequestForm = z.object({
    songName: z.string(),
    artist: z.string(),
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

export async function createSongRequest(prevState: State, formData: FormData) {
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

    // Create a new song request
    try {
        const response = await fetch("/api/song-request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ songName: songName, artist: artist, youtubeLink: youtubeLink, details: details })
        });

        if (!response.ok) {
            throw new Error("Failed to create song request. Try again later.");
        }

        redirect("/song-requests/success");
    } catch (error) {
        redirect("/song-requests/error");
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

