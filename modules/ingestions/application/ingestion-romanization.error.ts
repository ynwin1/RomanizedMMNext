export class RomanizationStateError extends Error {
  constructor() {
    super("Romanization can only run when ingestion is ready to generate or retrying after failure.");
    this.name = "RomanizationStateError";
  }
}

export class MissingTrustedSourceError extends Error {
  constructor() {
    super("Trusted Burmese source lyrics are required before romanization.");
    this.name = "MissingTrustedSourceError";
  }
}
