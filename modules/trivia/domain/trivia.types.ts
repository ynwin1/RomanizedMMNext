import { GameMode } from "@/app/lib/constants";

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
