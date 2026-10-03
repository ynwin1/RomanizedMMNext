"use server";

import { GameMode } from "@/app/lib/constants";
import { countryFlags } from "@/app/lib/utils";
import { triviaService, TriviaScoreInputSchema } from "@/modules/trivia";

export type TriviaScoreState = {
  errors?: {
    userName?: string[];
    country?: string[];
    score?: string[];
  };
  message?: string;
};

export async function createTriviaScore(
  prevState: TriviaScoreState,
  formData: FormData,
) {
  const validatedFields = TriviaScoreInputSchema.safeParse({
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
  const emoji = countryFlags[country] || "🌎";

  await triviaService.saveScore({
    userName,
    country: emoji,
    score,
    gameMode,
  });
}
