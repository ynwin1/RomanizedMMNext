import type { ArtistService } from "@/modules/artists/application/artist.service";
import type { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import { evaluateDraftAdminInputCompleteness } from "@/modules/content-drafts";
import type { IngestionService } from "./ingestion.service";
import {
  DraftArtistResolutionError,
  IngestionArtistResolutionStateError,
} from "./ingestion-artist-resolution.error";
import {
  AddDraftArtistSchema,
  ConfirmDraftArtistsSchema,
  RemoveDraftArtistSchema,
  ResolveDraftArtistSchema,
  type AddDraftArtistInput,
  type ConfirmDraftArtistsInput,
  type RemoveDraftArtistInput,
  type ResolveDraftArtistInput,
} from "./ingestion-artist-resolution.validation";

export class IngestionArtistResolutionService {
  constructor(
    private readonly ingestions: Pick<IngestionService, "getById" | "transition">,
    private readonly drafts: Pick<ContentDraftService, "getById" | "update">,
    private readonly artists: Pick<ArtistService, "getBySlug">,
  ) {}

  private async editable(ingestionId: unknown, draftId: string) {
    const ingestion = await this.ingestions.getById(ingestionId);
    if (ingestion.status !== "needs_admin_input" && ingestion.status !== "ready_for_review") {
      throw new IngestionArtistResolutionStateError();
    }

    const draft = await this.drafts.getById(draftId);
    if (draft.ingestionId !== ingestion.id) {
      throw new DraftArtistResolutionError("The content draft does not belong to this ingestion.");
    }

    return { ingestion, draft };
  }

  async resolve(ingestionId: unknown, input: ResolveDraftArtistInput, updatedBy?: string) {
    const parsed = ResolveDraftArtistSchema.parse(input);
    const { draft } = await this.editable(ingestionId, parsed.draftId);

    const currentArtist = draft.artists[parsed.artistIndex];
    if (!currentArtist) throw new DraftArtistResolutionError("Draft artist index is out of range.");
    if (currentArtist.kind !== "unresolved") {
      throw new DraftArtistResolutionError("This draft artist is already resolved.");
    }

    const canonical = await this.artists.getBySlug(parsed.artistSlug);
    const duplicateCanonical = draft.artists.some(
      (artist, index) =>
        index !== parsed.artistIndex &&
        artist.kind === "resolved" &&
        artist.artistId === canonical.id,
    );
    if (duplicateCanonical) {
      throw new DraftArtistResolutionError("That canonical artist is already on this draft.");
    }

    const artists = draft.artists.map((artist, index) =>
      index === parsed.artistIndex
        ? { kind: "resolved" as const, artistId: canonical.id, name: canonical.name, slug: canonical.slug }
        : artist,
    );

    await this.drafts.update(draft.id, parsed.draftRevision, { artists }, updatedBy);
    return this.drafts.getById(draft.id);
  }

  async add(ingestionId: unknown, input: AddDraftArtistInput, updatedBy?: string) {
    const parsed = AddDraftArtistSchema.parse(input);
    const { draft } = await this.editable(ingestionId, parsed.draftId);

    if (draft.artists.length >= 30) {
      throw new DraftArtistResolutionError("A draft can have at most 30 artists.");
    }

    const normalized = parsed.artistName.toLocaleLowerCase();
    const duplicate = draft.artists.some(
      artist => artist.name.trim().toLocaleLowerCase() === normalized,
    );
    if (duplicate) {
      throw new DraftArtistResolutionError("That artist is already on this draft.");
    }

    await this.drafts.update(
      draft.id,
      parsed.draftRevision,
      { artists: [...draft.artists, { kind: "unresolved", name: parsed.artistName }] },
      updatedBy,
    );
    return this.drafts.getById(draft.id);
  }

  async remove(ingestionId: unknown, input: RemoveDraftArtistInput, updatedBy?: string) {
    const parsed = RemoveDraftArtistSchema.parse(input);
    const { draft } = await this.editable(ingestionId, parsed.draftId);

    if (!draft.artists[parsed.artistIndex]) {
      throw new DraftArtistResolutionError("Draft artist index is out of range.");
    }

    const artists = draft.artists.filter((_, index) => index !== parsed.artistIndex);
    await this.drafts.update(draft.id, parsed.draftRevision, { artists }, updatedBy);
    return this.drafts.getById(draft.id);
  }

  async confirm(ingestionId: unknown, input: ConfirmDraftArtistsInput, updatedBy?: string) {
    const parsed = ConfirmDraftArtistsSchema.parse(input);
    const { ingestion, draft } = await this.editable(ingestionId, parsed.draftId);
    const completeness = evaluateDraftAdminInputCompleteness(draft);

    if (!completeness.artistsComplete) {
      throw new DraftArtistResolutionError("Add at least one artist before continuing.");
    }
    if (!completeness.metadataComplete) {
      throw new DraftArtistResolutionError("Complete required factual metadata before continuing.");
    }

    if (ingestion.status === "ready_for_review") {
      return { draft, ingestion, completeness };
    }

    const transitioned = await this.ingestions.transition(
      ingestion.id,
      ingestion.revision,
      "ready_for_review",
      updatedBy,
    );
    return { draft, ingestion: transitioned, completeness };
  }
}
