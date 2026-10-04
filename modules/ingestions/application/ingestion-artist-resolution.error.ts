export class IngestionArtistResolutionStateError extends Error {
  constructor() {
    super("Artists can only be resolved while the ingestion needs admin input.");
    this.name = "IngestionArtistResolutionStateError";
  }
}

export class DraftArtistResolutionError extends Error {
  constructor(message = "The selected draft artist cannot be resolved.") {
    super(message);
    this.name = "DraftArtistResolutionError";
  }
}
