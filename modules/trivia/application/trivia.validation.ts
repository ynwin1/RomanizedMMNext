import { z } from "zod";
import { GameMode } from "@/app/lib/constants";

export const TriviaScoreInputSchema = z.object({
  userName: z.string().min(1, { message: "Name is required." }).max(15, { message: "Max 15 characters." }),
  country: z.string().min(1, { message: "Country is required." }),
  score: z.number().min(1, { message: "Score is required." }),
  gameMode: z.nativeEnum(GameMode, { message: "Game mode is required." }),
});
