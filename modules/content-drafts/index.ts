import { ContentDraftService } from "./application/content-draft.service";
import { MongoContentDraftRepository } from "./infrastructure/content-draft.repository";

const contentDraftRepository = new MongoContentDraftRepository();

export const contentDraftService = new ContentDraftService(contentDraftRepository);

export * from "./domain/content-draft.types";
export * from "./application/content-draft.validation";
export * from "./application/content-draft-write.error";
export * from "./application/content-draft-metadata";
