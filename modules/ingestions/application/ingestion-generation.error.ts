export class AiGenerationStateError extends Error {
  constructor() {
    super("AI generation can only run when ingestion is ready to generate or retrying after failure.");
    this.name = "AiGenerationStateError";
  }
}

export class IncompleteAiGenerationError extends Error {
  constructor() {
    super("AI generation completed without all required generated fields.");
    this.name = "IncompleteAiGenerationError";
  }
}
