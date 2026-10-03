import { GameMode } from "../domain/game-mode";
import {
  CreateTriviaScoreInput,
  TriviaScoreEntity,
} from "../domain/trivia.types";

export interface ITriviaRepository {
  create(input: CreateTriviaScoreInput): Promise<TriviaScoreEntity>;
  listByGameMode(gameMode: GameMode): Promise<TriviaScoreEntity[]>;
  findMinimumScore(gameMode: GameMode): Promise<number | null>;
  deleteById(id: string, gameMode: GameMode): Promise<void>;
}
