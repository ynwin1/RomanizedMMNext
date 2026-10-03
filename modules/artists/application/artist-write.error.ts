export class ArtistConflictError extends Error {
  constructor(message = "This artist changed since you opened it. Reload before saving.") {
    super(message);
    this.name = "ArtistConflictError";
  }
}

export class DuplicateArtistError extends Error {
  constructor() {
    super("This artist slug already exists. Choose another slug.");
    this.name = "DuplicateArtistError";
  }
}
