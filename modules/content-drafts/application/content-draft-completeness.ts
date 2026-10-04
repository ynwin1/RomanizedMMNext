import type { ContentDraftRecord } from "../domain/content-draft.types";
import { evaluateDraftMetadataCompleteness } from "./content-draft-metadata";

export interface DraftAdminInputCompleteness {
  complete: boolean;
  metadataComplete: boolean;
  artistsComplete: boolean;
}

export function evaluateDraftAdminInputCompleteness(
  draft: ContentDraftRecord,
): DraftAdminInputCompleteness {
  const metadataComplete = evaluateDraftMetadataCompleteness(draft.metadata).complete;
  const artistsComplete = draft.artists.length > 0;

  return {
    complete: metadataComplete && artistsComplete,
    metadataComplete,
    artistsComplete,
  };
}
