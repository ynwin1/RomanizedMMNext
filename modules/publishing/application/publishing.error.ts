export class PublicationStateError extends Error {
  constructor(message = "Only a reviewed draft can be published.") {
    super(message);
    this.name = "PublicationStateError";
  }
}

export class DraftNotPublishableError extends Error {
  constructor(message = "Complete the required review fields before publishing.") {
    super(message);
    this.name = "DraftNotPublishableError";
  }
}

export class PublicationMmidAllocationError extends Error {
  constructor() {
    super("Unable to allocate a song ID. Please retry publishing.");
    this.name = "PublicationMmidAllocationError";
  }
}
