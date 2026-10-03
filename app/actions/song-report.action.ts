"use server";

import { z } from "zod";
import { reportService } from "@/modules/reports";
import { logger } from "@/infrastructure/logging/logger";

const SongReportForm = z.object({
  songName: z.string().min(1, { message: "Song Name is required." }),
  artist: z.string().min(1, { message: "Artist is required." }),
  details: z.string().min(1, { message: "Details required." }),
});

export type ReportState = {
  errors?: {
    songName?: string[];
    artist?: string[];
    details?: string[];
  };
  message?: string;
};

export async function createSongReport(
  prevState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const validatedFields = SongReportForm.safeParse({
    songName: formData.get("songName"),
    artist: formData.get("artist"),
    details: formData.get("details"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please fill out all the required fields. Try Again!",
    };
  }

  try {
    await reportService.submit(validatedFields.data);
    return { message: "Report submitted successfully ✅" };
  } catch (error) {
    logger.error("Failed to submit song report", error);
    return { message: "Failed to submit report ❌. Please try again later!" };
  }
}
