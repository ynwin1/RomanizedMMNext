import type { TriviaScoreEntity } from "../domain/trivia.types";

export type TriviaLeaderboardRecord = Omit<TriviaScoreEntity, "id"> & {
  _id: string;
};
