import { IngestionService } from "./application/ingestion.service";
import { MongoIngestionRepository } from "./infrastructure/ingestion.repository";

const ingestionRepository = new MongoIngestionRepository();

export const ingestionService = new IngestionService(ingestionRepository);

export * from "./domain/ingestion.types";
export * from "./domain/ingestion-state";
export * from "./application/ingestion.validation";
export * from "./application/ingestion-write.error";
