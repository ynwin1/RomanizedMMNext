export class IngestionMetadataStateError extends Error {
  constructor() {
    super("Factual metadata can only be edited after AI generation is complete.");
    this.name = "IngestionMetadataStateError";
  }
}
