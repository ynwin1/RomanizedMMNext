import connectDB from "@/infrastructure/database/mongodb";
import { GameMode } from "@/app/lib/constants";
import { CreateTriviaScoreInput, TriviaScoreEntity } from "../domain/trivia.types";
import TriviaScore, { type ITriviaScore } from "./trivia-score.model";
import { ITriviaRepository } from "../application/trivia.repository";

type TriviaScorePersistenceRecord = Pick<ITriviaScore, Exclude<keyof TriviaScoreEntity, "id">> & { _id?: unknown };

function toEntity(score: TriviaScorePersistenceRecord): TriviaScoreEntity {
  return {
    id: score._id == null ? "" : String(score._id),
    userName: score.userName,
    score: score.score,
    country: score.country,
    date: score.date,
    gameMode: score.gameMode,
  };
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
