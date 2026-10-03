"use server";

import { redirect } from "next/navigation";
import { songRequestService, SongRequestInputSchema } from "@/modules/requests";
import { sendDiscordNotification } from "@/integrations/notifications/discord-notification.adapter";
import { logger } from "@/infrastructure/logging/logger";

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
  const validatedFields = SongRequestInputSchema.safeParse({
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
        logger.warn("Song request persisted but Discord notification failed");
      }
    }

    message = "Song request submitted successfully";
    redirectPath = `/${locale}/song-request/success`;
  } catch (error) {
    logger.error("Failed to persist song request", error);
    message = "Failed to submit song request. Please try again!";
    redirectPath = `/${locale}/song-request/error`;
  } finally {
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  return { message, errors: {} };
}
