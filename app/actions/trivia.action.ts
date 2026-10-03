"use server";

import { z } from "zod";
import { GameMode } from "@/app/lib/constants";
import { countryFlags } from "@/app/lib/utils";
import { triviaService } from "@/modules/trivia";

export type TriviaScoreState = {
  errors?: {
    userName?: string[];
    country?: string[];
    score?: string[];
  };
  message?: string;
};

const TriviaScoreForm = z.object({
  userName: z.string().min(1, { message: "Name is required." }).max(15, { message: "Max 15 characters." }),
  country: z.string().min(1, { message: "Country is required." }),
  score: z.number().min(1, { message: "Score is required." }),
  gameMode: z.nativeEnum(GameMode, { message: "Game mode is required." }),
});

export async function createTriviaScore(
  prevState: TriviaScoreState,
  formData: FormData,
) {
  const validatedFields = TriviaScoreForm.safeParse({
    userName: formData.get("userName"),
    country: formData.get("country"),
    score: parseInt(formData.get("score") as string),
    gameMode: formData.get("gameMode") as GameMode,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please fill out all the required fields. Try Again!",
    };
  }

  const { userName, country, score, gameMode } = validatedFields.data;

  try {
    await saveScoreAction(userName, country, score, gameMode);
    return { message: "Score saved successfully" };
  } catch (error) {
    console.error(`Error when saving score - ${(error as Error).message}`);
    return {
      message: "Failed to save score. Please try again!",
      errors: {},
    };
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

async function saveScoreAction(
  userName: string,
  country: string,
  score: number,
  gameMode: GameMode,
) {
  try {
    const emoji = countryFlags[country] || "🌎";

    await triviaService.saveScore({
      userName,
      country: emoji,
      score,
      gameMode,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save score:", error);
    return { success: false };
  }
}
