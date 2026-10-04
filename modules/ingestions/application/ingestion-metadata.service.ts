import type { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import {
  evaluateDraftMetadataCompleteness,
  SaveDraftMetadataSchema,
  type SaveDraftMetadataInput,
} from "@/modules/content-drafts";
import { IngestionService } from "./ingestion.service";
import { IngestionMetadataStateError } from "./ingestion-metadata.error";

export class IngestionMetadataService {
  constructor(
    private readonly ingestions: Pick<IngestionService, "getById">,
    private readonly drafts: Pick<ContentDraftService, "getById" | "update">,
  ) {}

  async save(ingestionId: unknown, input: SaveDraftMetadataInput, updatedBy?: string) {
    const ingestion = await this.ingestions.getById(ingestionId);
    if (ingestion.status !== "needs_admin_input") throw new IngestionMetadataStateError();

    const parsed = SaveDraftMetadataSchema.parse(input);
    const current = await this.drafts.getById(parsed.draftId);
    if (current.ingestionId !== ingestion.id) throw new IngestionMetadataStateError();

    await this.drafts.update(
      current.id,
      parsed.draftRevision,
      {
        metadata: {
          genre: parsed.genre,
          albumName: parsed.albumName || null,
          spotifyTrackId: parsed.spotifyTrackId || null,
          spotifyLink: parsed.spotifyLink,
          appleMusicLink: parsed.appleMusicLink,
          youtubeLinks: parsed.youtubeLinks?.length ? parsed.youtubeLinks : null,
          imageLink: parsed.imageLink,
        },
      },
      updatedBy,
    );

    const draft = await this.drafts.getById(current.id);
    return {
      draft,
      completeness: evaluateDraftMetadataCompleteness(draft.metadata),
    };
  }
}
