import {z} from "zod";
import {PLAYLIST_GENRES} from "../domain/playlist.types";
import {parsePlaylistUrl} from "./playlist.validation";

export const PlaylistSubmissionSchema = z.object({
  playlistId: z.string().trim().min(1).max(2048),
  genre: z.enum(PLAYLIST_GENRES),
}).strict().superRefine(({playlistId}, ctx) => {
  const raw = /^[A-Za-z0-9]{22}$/.test(playlistId)
    ? `https://open.spotify.com/playlist/${playlistId}` : playlistId;
  const parsed = parsePlaylistUrl("spotify", raw);
  if (!parsed) ctx.addIssue({code: "custom", path: ["playlistId"], message: "Enter a valid Spotify playlist ID or public URL."});
}).transform(({playlistId, genre}) => {
  const raw = /^[A-Za-z0-9]{22}$/.test(playlistId)
    ? `https://open.spotify.com/playlist/${playlistId}` : playlistId;
  const parsed = parsePlaylistUrl("spotify", raw)!;
  return {playlistId: parsed.id, url: parsed.url, genre};
});

export type PlaylistSubmissionInput = z.output<typeof PlaylistSubmissionSchema>;
