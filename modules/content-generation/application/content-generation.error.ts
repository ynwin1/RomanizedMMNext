export class ContentGenerationProviderError extends Error {
  constructor(
    message = "Content generation provider failed.",
    public readonly retryable = false,
    public readonly causeCode?: string,
  ) {
    super(message);
    this.name = "ContentGenerationProviderError";
  }
}

export class InvalidGeneratedContentError extends Error {
  constructor(message = "Generated content did not match the required contract.") {
    super(message);
    this.name = "InvalidGeneratedContentError";
  }
}
