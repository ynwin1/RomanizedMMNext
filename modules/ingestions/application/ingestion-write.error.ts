export class IngestionConflictError extends Error {
  constructor(message = "This ingestion changed since you opened it. Reload before continuing.") {
    super(message);
    this.name = "IngestionConflictError";
  }
}

export class DuplicateIngestionError extends Error {
  constructor() {
    super("An ingestion already exists for this song request.");
    this.name = "DuplicateIngestionError";
  }
}

export class InvalidIngestionTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Ingestion cannot transition from ${from} to ${to}.`);
    this.name = "InvalidIngestionTransitionError";
  }
}
