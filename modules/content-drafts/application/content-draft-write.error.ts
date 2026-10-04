export class ContentDraftConflictError extends Error {
  constructor(message = "This draft changed since you opened it. Reload before saving.") {
    super(message);
    this.name = "ContentDraftConflictError";
  }
}

export class DuplicateContentDraftError extends Error {
  constructor() {
    super("A content draft already exists for this ingestion.");
    this.name = "DuplicateContentDraftError";
  }
}
