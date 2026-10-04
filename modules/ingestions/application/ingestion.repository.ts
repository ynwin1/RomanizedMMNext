import type { CreateIngestionInput } from "./ingestion.validation";
import type { IngestionEntity, IngestionRecord, IngestionStatus } from "../domain/ingestion.types";

export interface IIngestionRepository {
  create(input: CreateIngestionInput, updatedBy?: string): Promise<IngestionEntity>;
  findById(id: string): Promise<IngestionRecord | null>;
  transition(
    id: string,
    revision: number,
    fromStatus: IngestionStatus,
    toStatus: IngestionStatus,
    updatedBy?: string,
  ): Promise<IngestionEntity | null>;
}
