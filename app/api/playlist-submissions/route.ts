import {PlaylistSubmissionSchema} from "@/modules/playlists/application/playlist-submission";
import {createPlaylistSubmission} from "@/modules/playlists";
import {sendDiscordNotification} from "@/integrations/notifications/discord-notification.adapter";
import {logger} from "@/infrastructure/logging/logger";

export async function POST(req: Request) {
  const body = await req.text();
  if (body.length > 4096) return Response.json({error: "Submission too large"}, {status: 413});
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return Response.json({error: "Invalid request"}, {status: 400}); }
  const parsed = PlaylistSubmissionSchema.safeParse(payload);
  if (!parsed.success) return Response.json({error: "Enter a valid Spotify playlist ID and genre."}, {status: 400});
  try {
    const result = await createPlaylistSubmission(parsed.data);
    if (!result.created) return Response.json({message: "This playlist has already been submitted for this genre."}, {status: 200});
    const webhook = process.env.DISCORD_PLAYLIST_WEBHOOK || process.env.DISCORD_SONG_REQ_WEBHOOK;
    if (webhook) {
      try {
        await sendDiscordNotification(webhook, {
          content: `🎶 New playlist submission\nGenre: ${parsed.data.genre}\nSpotify: ${parsed.data.url}\nReview: https://www.romanizedmm.com/admin/playlists/submissions`,
        });
      } catch (error) { logger.warn("Playlist submission saved but Discord notification failed"); }
    }
    return Response.json({message: "Thanks! Your playlist has been sent for review."}, {status: 201});
  } catch (error) {
    logger.error("Playlist submission failed", error);
    return Response.json({error: "Unable to submit playlist. Please try again."}, {status: 500});
  }
}
