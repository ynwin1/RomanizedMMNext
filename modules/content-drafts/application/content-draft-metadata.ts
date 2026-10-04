import type { DraftMetadata } from "../domain/content-draft.types";

export interface DraftMetadataCompleteness {
  complete: boolean;
  missing: Array<"genre">;
}

export function evaluateDraftMetadataCompleteness(metadata: DraftMetadata): DraftMetadataCompleteness {
  const missing: Array<"genre"> = [];
  if (!metadata.genre?.trim()) missing.push("genre");
  return { complete: missing.length === 0, missing };
}
