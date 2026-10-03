import { z } from "zod";

export const SongRequestInputSchema = z.object({
  songName: z.string().min(1, { message: "Song Name is required." }),
  artist: z.string().min(1, { message: "Artist is required." }),
  youtubeLink: z.string().optional(),
  details: z.string().optional(),
  requestedBy: z.string().optional(),
  songStory: z.string().optional().refine(
    value => !value || value.trim().split(/\s+/).length <= 50,
    { message: "50 words maximum" },
  ),
  notifyEmail: z.string().optional().transform(val => val === "" ? undefined : val)
    .pipe(z.string().email({ message: "Invalid email address." }).optional()),
});

export const SongRequestIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid request id");
export const SongRequestRevisionSchema = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const SongRequestStatusSchema = z.enum(["pending", "reviewing", "accepted", "rejected", "completed"]);
export type ManagedSongRequestStatus = z.infer<typeof SongRequestStatusSchema>;
