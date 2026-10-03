export class SongRequestConflictError extends Error {
  constructor(message = "This request changed since you opened it. Reload before saving.") {
    super(message);
    this.name = "SongRequestConflictError";
  }
}
