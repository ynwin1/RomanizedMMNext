import { GameMode } from "./game-mode";

export interface TriviaScoreEntity {
  id: string;
  userName: string;
  score: number;
  country: string;
  date: Date;
  gameMode: GameMode;
}

export interface CreateTriviaScoreInput {
  userName: string;
  score: number;
  country: string;
  gameMode: GameMode;
}
