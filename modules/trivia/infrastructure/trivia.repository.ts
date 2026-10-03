import connectDB from "@/infrastructure/database/mongodb";
import { GameMode } from "@/app/lib/constants";
import { CreateTriviaScoreInput, TriviaScoreEntity } from "../domain/trivia.types";
import TriviaScore from "./trivia-score.model";

function toEntity(score: any): TriviaScoreEntity {
  return {
    id: score._id?.toString?.() ?? "",
    userName: score.userName,
    score: score.score,
    country: score.country,
    date: score.date,
    gameMode: score.gameMode,
  };
}

export interface ITriviaRepository {
  create(input: CreateTriviaScoreInput): Promise<TriviaScoreEntity>;
  listByGameMode(gameMode: GameMode): Promise<TriviaScoreEntity[]>;
  findMinimumScore(gameMode: GameMode): Promise<number | null>;
  deleteById(id: string, gameMode: GameMode): Promise<void>;
}

export class MongoTriviaRepository implements ITriviaRepository {
  async create(input: CreateTriviaScoreInput): Promise<TriviaScoreEntity> {
    await connectDB();
    const score = await TriviaScore.create(input);
    return toEntity(score.toObject());
  }

  async listByGameMode(gameMode: GameMode): Promise<TriviaScoreEntity[]> {
    await connectDB();
    const scores = await TriviaScore.find({ gameMode }).sort({ score: -1 }).lean();
    return scores.map(toEntity);
  }

  async findMinimumScore(gameMode: GameMode): Promise<number | null> {
    await connectDB();
    const result = await TriviaScore.find({ gameMode })
      .sort({ score: 1 })
      .limit(1)
      .select("score -_id")
      .lean();

    return result[0]?.score ?? null;
  }

  async deleteById(id: string, gameMode: GameMode): Promise<void> {
    await connectDB();
    await TriviaScore.deleteOne({ _id: id, gameMode });
  }
}
