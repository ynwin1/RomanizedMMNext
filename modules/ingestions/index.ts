import { contentDraftService } from "@/modules/content-drafts";
import { songRequestService } from "@/modules/requests";
import { IngestionService } from "./application/ingestion.service";
import { IngestionWorkflowService } from "./application/ingestion-workflow.service";
import { MongoIngestionRepository } from "./infrastructure/ingestion.repository";

const ingestionRepository = new MongoIngestionRepository();

export const ingestionService = new IngestionService(ingestionRepository);
export const ingestionWorkflowService = new IngestionWorkflowService(
  ingestionService,
  songRequestService,
  contentDraftService,
);

export * from "./domain/ingestion.types";
export * from "./domain/ingestion-state";
export * from "./application/ingestion.validation";
export * from "./application/ingestion-write.error";
export * from "./application/ingestion-workflow.error";
export * from "./application/ingestion-romanization.error";
export * from "./application/ingestion-romanization.service";
export * from "./application/ingestion-generation.error";
export * from "./application/ingestion-generation.service";
export * from "./application/ingestion-metadata.error";
export * from "./application/ingestion-metadata.service";
export * from "./application/ingestion-artist-resolution.error";
export * from "./application/ingestion-artist-resolution.validation";
export * from "./application/ingestion-artist-resolution.service";
export * from "./application/ingestion-review.error";
export * from "./application/ingestion-review.service";
