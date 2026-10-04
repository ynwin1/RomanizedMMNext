import type { ContentDraftEntity, ContentDraftRecord } from "../domain/content-draft.types";
import type { ContentDraftPatch, CreateContentDraftInput } from "./content-draft.validation";

export interface IContentDraftRepository {
  create(input: CreateContentDraftInput, updatedBy?: string): Promise<ContentDraftEntity>;
  findById(id: string): Promise<ContentDraftRecord | null>;
  findByIngestionId(ingestionId: string): Promise<ContentDraftRecord | null>;
  update(
    id: string,
    revision: number,
    patch: ContentDraftPatch,
    updatedBy?: string,
  ): Promise<ContentDraftEntity | null>;
}
