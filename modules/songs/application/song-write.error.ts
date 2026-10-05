export class SongConflictError extends Error {
  constructor(message = "This song changed since you opened it. Reload before saving.") {
    super(message);
    this.name = "SongConflictError";
  }
}

export class DuplicateSongError extends Error {
  constructor() {
    super("This song ID already exists. Choose another ID.");
    this.name = "DuplicateSongError";
  }
}

export class DuplicatePublishedSongError extends Error {
  constructor() {
    super("This ingestion already has a published song.");
    this.name = "DuplicatePublishedSongError";
  }
}


export class CanonicalLyricsRequiredError extends Error {
  constructor() {
    super("Lyrics V2 is required for song writes.");
    this.name = "CanonicalLyricsRequiredError";
  }
}
