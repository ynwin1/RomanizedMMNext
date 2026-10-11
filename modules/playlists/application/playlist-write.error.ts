export class DuplicatePlaylistError extends Error {
  constructor() { super("This playlist is already in the directory."); this.name = "DuplicatePlaylistError"; }
}

export class PlaylistConflictError extends Error {
  constructor() { super("This playlist changed since you opened it. Refresh and retry."); this.name = "PlaylistConflictError"; }
}
