export class RequestNotAcceptedForIngestionError extends Error {
  constructor() {
    super("Only accepted song requests can start ingestion.");
    this.name = "RequestNotAcceptedForIngestionError";
  }
}

export class IngestionSourceStateError extends Error {
  constructor() {
    super("Burmese source can only be confirmed while ingestion is awaiting source.");
    this.name = "IngestionSourceStateError";
  }
}
