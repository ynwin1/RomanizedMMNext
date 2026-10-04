export class IngestionReviewStateError extends Error {
  constructor() {
    super("Draft review edits are only allowed when the ingestion is ready for review.");
    this.name = "IngestionReviewStateError";
  }
}
