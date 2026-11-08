import { z } from "zod";
import { SongIdSchema } from "./song.validation";
import { parseYouTubeVideoId } from "./song-cover.youtube";

export const CoverSongIdSchema = SongIdSchema;
export const CoverRecordIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid cover ID");
const optionalText = (max: number) => z.string().trim().max(max).optional();
const youtubeUrl = z.string().trim().max(2048).refine(
  value => parseYouTubeVideoId(value) !== null, "Invalid YouTube video URL",
);

export const CreateAdminCoverSchema = z.object({
  youtubeUrl,
  title: optionalText(200),
  description: optionalText(500),
  contributorName: optionalText(100),
}).strict();
export const EditCoverSchema = z.object({
  title: optionalText(200),
  description: optionalText(500),
  contributorName: optionalText(100),
}).strict().refine(value => Object.keys(value).length > 0, "No changes supplied");
export const ReviewCoverSchema = z.enum(["approved", "rejected"]);
export const ReorderCoverSchema = z.array(CoverRecordIdSchema).max(500);

export type CreateAdminCover = z.infer<typeof CreateAdminCoverSchema>;
export type EditCover = z.infer<typeof EditCoverSchema>;
