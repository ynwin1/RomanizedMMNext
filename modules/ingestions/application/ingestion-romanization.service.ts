import type { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import type { ContentGenerationService } from "@/modules/content-generation/application/content-generation.service";
import type { RomanizationReference } from "@/modules/content-generation";
import { IngestionService } from "./ingestion.service";
import { IngestionConflictError } from "./ingestion-write.error";
import { MissingTrustedSourceError, RomanizationStateError } from "./ingestion-romanization.error";

function sourceLines(source: string) {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
    .map((text, index) => ({ index, text }));
}

function joinGeneratedLines(lines: Array<{ text: string }>): string {
  return lines.map(line => line.text).join("\n");
}

export class IngestionRomanizationService {
  constructor(
    private readonly ingestions: IngestionService,
    private readonly drafts: Pick<ContentDraftService, "getByIngestionId" | "update">,
    private readonly generation: Pick<ContentGenerationService, "romanize">,
  ) {}

  async generate(
    ingestionId: unknown,
    updatedBy?: string,
    references: RomanizationReference[] = [],
  ) {
    const initial = await this.ingestions.getById(ingestionId);
    if (initial.status !== "ready_to_generate" && initial.status !== "failed") {
      throw new RomanizationStateError();
    }

    const draft = await this.drafts.getByIngestionId(initial.id);
    const source = draft.source.burmeseLyrics;
    if (!source?.trim()) throw new MissingTrustedSourceError();

    await this.ingestions.transition(
      initial.id,
      initial.revision,
      "generating",
      updatedBy,
    );

    try {
      const generated = await this.generation.romanize({
        lines: sourceLines(source),
        ...(references.length ? { references } : {}),
      });
      await this.drafts.update(
        draft.id,
        draft.revision,
        { generated: { romanized: joinGeneratedLines(generated.lines) } },
        updatedBy,
      );

      const latest = await this.ingestions.getById(initial.id);
      await this.ingestions.transition(
        latest.id,
        latest.revision,
        "ready_to_generate",
        updatedBy,
      );

      return {
        ingestion: await this.ingestions.getById(initial.id),
        draft: await this.drafts.getByIngestionId(initial.id),
      };
    } catch (error) {
      try {
        const latest = await this.ingestions.getById(initial.id);
        if (latest.status === "generating") {
          await this.ingestions.transition(latest.id, latest.revision, "failed", updatedBy);
        }
      } catch (transitionError) {
        if (!(transitionError instanceof IngestionConflictError)) throw transitionError;
      }
      throw error;
    }
  }
}
