import { NotFoundError } from "@/shared/errors/not-found.error";
import type { SongRequestService } from "@/modules/requests/application/song-request.service";
import type { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import type {
  ContentDraftPatch,
  ContentDraftRecord,
} from "@/modules/content-drafts";
import type { IngestionRecord } from "../domain/ingestion.types";
import { IngestionService } from "./ingestion.service";
import { SaveIngestionSourceSchema } from "./ingestion.validation";
import { IngestionSourceStateError, RequestNotAcceptedForIngestionError } from "./ingestion-workflow.error";

export interface StartedIngestion {
  ingestion: IngestionRecord;
  draft: ContentDraftRecord;
}

function seedPatch(
  draft: ContentDraftRecord,
  request: {
    songName: string;
    artist: string;
    requestedBy?: string;
  },
): ContentDraftPatch | null {
  const patch: ContentDraftPatch = {};

  if (!draft.identity.songName?.trim()) {
    patch.identity = { songName: request.songName };
  }

  const metadata: NonNullable<ContentDraftPatch["metadata"]> = {};
  if (!draft.metadata.requestedBy?.trim() && request.requestedBy?.trim()) {
    metadata.requestedBy = request.requestedBy;
  }
  if (Object.keys(metadata).length > 0) patch.metadata = metadata;

  if (draft.artists.length === 0) {
    patch.artists = [{ kind: "unresolved", name: request.artist }];
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export class IngestionWorkflowService {
  constructor(
    private readonly ingestions: IngestionService,
    private readonly requests: Pick<SongRequestService, "getAdminDetail" | "updateStatus">,
    private readonly drafts: Pick<ContentDraftService, "createForIngestion" | "getByIngestionId" | "update">,
  ) {}

  async acceptRequest(
    songRequestId: unknown,
    requestRevision: unknown,
    updatedBy?: string,
  ): Promise<StartedIngestion> {
    const accepted = await this.requests.updateStatus(
      songRequestId,
      requestRevision,
      "accepted",
      updatedBy,
    );
    return this.startAcceptedRequest(accepted.id, updatedBy);
  }

  async startAcceptedRequest(songRequestId: unknown, updatedBy?: string): Promise<StartedIngestion> {
    const request = await this.requests.getAdminDetail(songRequestId);
    if (request.status !== "accepted") throw new RequestNotAcceptedForIngestionError();

    let ingestion = await this.ingestions.findByRequestId(request.id);
    if (!ingestion) {
      const created = await this.ingestions.createForRequest(request.id, updatedBy);
      ingestion = await this.ingestions.getById(created.id);
    }

    let draft: ContentDraftRecord;
    try {
      draft = await this.drafts.getByIngestionId(ingestion.id);
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      await this.drafts.createForIngestion(ingestion.id, updatedBy);
      draft = await this.drafts.getByIngestionId(ingestion.id);
    }

    const patch = seedPatch(draft, request);
    if (patch) {
      await this.drafts.update(draft.id, draft.revision, patch, updatedBy);
      draft = await this.drafts.getByIngestionId(ingestion.id);
    }

    return { ingestion, draft };
  }

  async saveAndConfirmSource(input: unknown, updatedBy?: string): Promise<StartedIngestion> {
    const command = SaveIngestionSourceSchema.parse(input);
    const ingestion = await this.ingestions.getById(command.ingestionId);
    if (ingestion.status !== "awaiting_source") throw new IngestionSourceStateError();

    const draft = await this.drafts.getByIngestionId(ingestion.id);
    await this.drafts.update(
      draft.id,
      command.draftRevision,
      { source: { burmeseLyrics: command.burmeseLyrics } },
      updatedBy,
    );

    await this.ingestions.transition(
      ingestion.id,
      command.ingestionRevision,
      "ready_to_generate",
      updatedBy,
    );

    return {
      ingestion: await this.ingestions.getById(ingestion.id),
      draft: await this.drafts.getByIngestionId(ingestion.id),
    };
  }
}
