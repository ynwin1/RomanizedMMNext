"use server";

import { GameMode } from "@/modules/trivia/domain/game-mode";
import { countryFlags } from "@/app/lib/utils";
import { triviaService, TriviaScoreInputSchema, type TriviaLeaderboardRecord } from "@/modules/trivia";
import { logger } from "@/infrastructure/logging/logger";

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
    logger.error("Failed to save trivia score", error);
    return {
      message: "Failed to save score. Please try again!",
      errors: {},
    };
  }
}

export async function fetchAllTriviaScores(gameMode: GameMode): Promise<TriviaLeaderboardRecord[]> {
  try {
    const scores = await triviaService.getLeaderboard(gameMode);
    return scores.map(({ id, ...score }) => ({
      ...score,
      _id: id,
    }));
  } catch (error) {
    logger.error("Failed to fetch trivia scores", error);
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
