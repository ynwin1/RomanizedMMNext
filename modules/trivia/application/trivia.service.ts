import { GameMode } from "@/app/lib/constants";
import { CreateTriviaScoreInput, TriviaScoreEntity } from "../domain/trivia.types";
import { ITriviaRepository } from "./trivia.repository";

export class TriviaService {
  constructor(private readonly scores: ITriviaRepository) {}

  async getMinimumScore(gameMode: GameMode): Promise<number> {
    return (await this.scores.findMinimumScore(gameMode)) ?? 0;
  }

  async getLeaderboard(gameMode: GameMode): Promise<TriviaScoreEntity[]> {
    return this.scores.listByGameMode(gameMode);
  }

  async saveScore(input: CreateTriviaScoreInput): Promise<void> {
    await this.scores.create(input);

    const leaderboard = await this.scores.listByGameMode(input.gameMode);
    if (leaderboard.length > 10) {
      await this.scores.deleteById(
        leaderboard[leaderboard.length - 1].id,
        input.gameMode,
      );
    }
  }
}
