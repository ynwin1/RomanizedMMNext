"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { songRequestService } from "@/modules/requests";
import { sendDiscordNotification } from "@/integrations/notifications/discord-notification.adapter";

const SongRequestForm = z.object({
  songName: z.string().min(1, { message: "Song Name is required." }),
  artist: z.string().min(1, { message: "Artist is required." }),
  youtubeLink: z.string().optional(),
  details: z.string().optional(),
  requestedBy: z.string().optional(),
  songStory: z.string().optional().refine(
    (value) => !value || value.trim().split(/\s+/).length <= 50,
    { message: "50 words maximum" },
  ),
  notifyEmail: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().email({ message: "Invalid email address." }).optional()),
});

export type SongRequestState = {
  errors?: {
    songName?: string[];
    artist?: string[];
    youtubeLink?: string[];
    details?: string[];
    requestedBy?: string[];
    songStory?: string[];
    notifyEmail?: string[];
  };
  message?: string;
};

export async function createSongRequest(
  locale: string,
  prevState: SongRequestState,
  formData: FormData,
) {
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
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields, Failed to Create Song Request.",
    };
  }

  const {
    songName,
    artist,
    youtubeLink,
    details,
    requestedBy,
    songStory,
    notifyEmail,
  } = validatedFields.data;

  const discordWebhook = process.env.DISCORD_SONG_REQ_WEBHOOK;

  let redirectPath: string | null = null;
  let message = "";

  const notProvided = "Not Provided";
  const email = notifyEmail || notProvided;
  const ytLink = youtubeLink || notProvided;
  const detailsText = details || notProvided;
  const reqBy = requestedBy || notProvided;
  const songStr = songStory || notProvided;

  try {
    await songRequestService.create({
      songName,
      artist,
      youtubeLink: ytLink,
      details: detailsText,
      requestedBy: reqBy,
      songStory: songStr,
      notifyEmail: email,
    });

    if (discordWebhook) {
      try {
        await sendDiscordNotification(discordWebhook, {
          content: `Song Name: ${songName}\nArtist: ${artist}\nYouTube Link: ${ytLink}\nDetails: ${detailsText}\nRequested By: ${reqBy}\nSong Story: ${songStr}\nNotify Email: ${email}`,
        });
      } catch (error) {
        console.error("Failed to send song request notification to Discord:", error);
      }
    }

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

  return { message, errors: {} };
}
