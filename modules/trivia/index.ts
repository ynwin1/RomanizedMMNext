import { TriviaService } from "./application/trivia.service";
import { MongoTriviaRepository } from "./infrastructure/trivia.repository";

const triviaRepository = new MongoTriviaRepository();

export const triviaService = new TriviaService(triviaRepository);

export * from "./domain/trivia.types";

export * from "./application/trivia.validation";
