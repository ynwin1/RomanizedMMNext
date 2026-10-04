import { NotFoundError } from "@/shared/errors/not-found.error";
import { canTransitionIngestion } from "../domain/ingestion-state";
import type { IngestionEntity, IngestionRecord } from "../domain/ingestion.types";
import type { IIngestionRepository } from "./ingestion.repository";
import {
  CreateIngestionSchema,
  IngestionIdSchema,
  IngestionRequestIdSchema,
  IngestionRevisionSchema,
  IngestionStatusSchema,
} from "./ingestion.validation";
import { IngestionConflictError, InvalidIngestionTransitionError } from "./ingestion-write.error";

export class IngestionService {
  constructor(private readonly ingestions: IIngestionRepository) {}

  async createForRequest(songRequestId: unknown, updatedBy?: string): Promise<IngestionEntity> {
    const input = CreateIngestionSchema.parse({ songRequestId });
    return this.ingestions.create(input, updatedBy);
  }

  async getById(id: unknown): Promise<IngestionRecord> {
    const ingestionId = IngestionIdSchema.parse(id);
    const ingestion = await this.ingestions.findById(ingestionId);
    if (!ingestion) throw new NotFoundError("Ingestion not found", "INGESTION_NOT_FOUND");
    return ingestion;
  }

  async findByRequestId(songRequestId: unknown): Promise<IngestionRecord | null> {
    return this.ingestions.findByRequestId(IngestionRequestIdSchema.parse(songRequestId));
  }

  async transition(id: unknown, revision: unknown, nextStatus: unknown, updatedBy?: string): Promise<IngestionEntity> {
    const ingestionId = IngestionIdSchema.parse(id);
    const expectedRevision = IngestionRevisionSchema.parse(revision);
    const next = IngestionStatusSchema.parse(nextStatus);

    const current = await this.ingestions.findById(ingestionId);
    if (!current) throw new NotFoundError("Ingestion not found", "INGESTION_NOT_FOUND");
    if (current.revision !== expectedRevision) throw new IngestionConflictError();
    if (!canTransitionIngestion(current.status, next)) {
      throw new InvalidIngestionTransitionError(current.status, next);
    }

    const transitioned = await this.ingestions.transition(
      ingestionId,
      expectedRevision,
      current.status,
      next,
      updatedBy,
    );
    if (transitioned) return transitioned;

    if (!(await this.ingestions.findById(ingestionId))) {
      throw new NotFoundError("Ingestion not found", "INGESTION_NOT_FOUND");
    }
    throw new IngestionConflictError();
  }
}
