import { NotFoundError } from "@/shared/errors/not-found.error";
import type { ContentDraftEntity, ContentDraftRecord } from "../domain/content-draft.types";
import type { IContentDraftRepository } from "./content-draft.repository";
import {
  ContentDraftIdSchema,
  ContentDraftIngestionIdSchema,
  ContentDraftPatchSchema,
  ContentDraftRevisionSchema,
  CreateContentDraftSchema,
} from "./content-draft.validation";
import { ContentDraftConflictError } from "./content-draft-write.error";

export class ContentDraftService {
  constructor(private readonly drafts: IContentDraftRepository) {}

  async createForIngestion(ingestionId: unknown, updatedBy?: string): Promise<ContentDraftEntity> {
    const input = CreateContentDraftSchema.parse({ ingestionId });
    return this.drafts.create(input, updatedBy);
  }

  async getById(id: unknown): Promise<ContentDraftRecord> {
    const draftId = ContentDraftIdSchema.parse(id);
    const draft = await this.drafts.findById(draftId);
    if (!draft) throw new NotFoundError("Content draft not found", "CONTENT_DRAFT_NOT_FOUND");
    return draft;
  }

  async getByIngestionId(ingestionId: unknown): Promise<ContentDraftRecord> {
    const parsed = ContentDraftIngestionIdSchema.parse(ingestionId);
    const draft = await this.drafts.findByIngestionId(parsed);
    if (!draft) throw new NotFoundError("Content draft not found", "CONTENT_DRAFT_NOT_FOUND");
    return draft;
  }

  async update(
    id: unknown,
    revision: unknown,
    patch: unknown,
    updatedBy?: string,
  ): Promise<ContentDraftEntity> {
    const draftId = ContentDraftIdSchema.parse(id);
    const expectedRevision = ContentDraftRevisionSchema.parse(revision);
    const parsedPatch = ContentDraftPatchSchema.parse(patch);

    const updated = await this.drafts.update(draftId, expectedRevision, parsedPatch, updatedBy);
    if (updated) return updated;

    if (!(await this.drafts.findById(draftId))) {
      throw new NotFoundError("Content draft not found", "CONTENT_DRAFT_NOT_FOUND");
    }
    throw new ContentDraftConflictError();
  }
}
