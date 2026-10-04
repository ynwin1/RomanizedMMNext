import type { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import {
  SaveDraftReviewSchema,
  type SaveDraftReviewInput,
} from "@/modules/content-drafts";
import type { IngestionService } from "./ingestion.service";
import { IngestionReviewStateError } from "./ingestion-review.error";

export class IngestionReviewService {
  constructor(
    private readonly ingestions: Pick<IngestionService, "getById">,
    private readonly drafts: Pick<ContentDraftService, "getById" | "update">,
  ) {}

  async save(ingestionId: unknown, input: SaveDraftReviewInput, updatedBy?: string) {
    const ingestion = await this.ingestions.getById(ingestionId);
    if (ingestion.status !== "ready_for_review" && ingestion.status !== "needs_admin_input") {
      throw new IngestionReviewStateError();
    }

    const parsed = SaveDraftReviewSchema.parse(input);
    const draft = await this.drafts.getById(parsed.draftId);
    if (draft.ingestionId !== ingestion.id) throw new IngestionReviewStateError();

    await this.drafts.update(
      draft.id,
      parsed.draftRevision,
      {
        identity: { songName: parsed.songName },
        source: { burmeseLyrics: parsed.burmeseLyrics },
        generated: {
          romanized: parsed.romanized,
          meaning: parsed.meaning,
          about: parsed.about,
          whenToListen: parsed.whenToListen,
        },
        metadata: {
          genre: parsed.genre,
          albumName: parsed.albumName,
          spotifyTrackId: parsed.spotifyTrackId,
          spotifyLink: parsed.spotifyLink,
          appleMusicLink: parsed.appleMusicLink,
          youtubeLinks: parsed.youtubeLinks?.length ? parsed.youtubeLinks : null,
          imageLink: parsed.imageLink,
        },
      },
      updatedBy,
    );

    return {
      ingestion,
      draft: await this.drafts.getById(draft.id),
    };
  }
}
