import type { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import type { ContentDraftRecord } from "@/modules/content-drafts/domain/content-draft.types";
import type { ContentGenerationService } from "@/modules/content-generation/application/content-generation.service";
import {
  evaluateCompleteGeneratedContent,
  GeneratedContentQualityError,
} from "@/modules/content-generation";
import { IngestionService } from "./ingestion.service";
import { IngestionConflictError } from "./ingestion-write.error";
import { IngestionRomanizationService } from "./ingestion-romanization.service";
import { MissingTrustedSourceError } from "./ingestion-romanization.error";
import { AiGenerationStateError, IncompleteAiGenerationError } from "./ingestion-generation.error";

function sourceLines(source: string) {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
    .map((text, index) => ({ index, text }));
}

function generatedLines(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
    .map((line, index) => ({ index, text: line }));
}

function joinGeneratedLines(lines: Array<{ text: string }>): string {
  return lines.map(line => line.text).join("\n");
}

function completeAiContent(draft: ContentDraftRecord): draft is ContentDraftRecord & {
  generated: {
    romanized: string;
    meaning: string;
    about: string;
    whenToListen: string;
  };
} {
  const generated = draft.generated;
  return Boolean(
    generated.romanized?.trim() &&
    generated.meaning?.trim() &&
    generated.about?.trim() &&
    generated.whenToListen?.trim()
  );
}

export class IngestionGenerationService {
  private readonly romanization: IngestionRomanizationService;

  constructor(
    private readonly ingestions: IngestionService,
    private readonly drafts: Pick<ContentDraftService, "getByIngestionId" | "update">,
    private readonly generation: Pick<ContentGenerationService, "romanize" | "translateMeaning" | "generateEditorialMetadata">,
  ) {
    this.romanization = new IngestionRomanizationService(ingestions, drafts, generation);
  }

  async generateAll(ingestionId: unknown, updatedBy?: string) {
    let initial = await this.ingestions.getById(ingestionId);
    if (initial.status !== "ready_to_generate" && initial.status !== "failed") {
      throw new AiGenerationStateError();
    }

    let draft = await this.drafts.getByIngestionId(initial.id);
    const source = draft.source.burmeseLyrics;
    if (!source?.trim()) throw new MissingTrustedSourceError();

    if (!draft.generated.romanized?.trim()) {
      await this.romanization.generate(initial.id, updatedBy);
      initial = await this.ingestions.getById(initial.id);
      draft = await this.drafts.getByIngestionId(initial.id);
    }

    await this.ingestions.transition(initial.id, initial.revision, "generating", updatedBy);

    try {
      const sourceInput = { lines: sourceLines(source) };
      const meaning = draft.generated.meaning?.trim()
        ? { lines: generatedLines(draft.generated.meaning) }
        : await this.generation.translateMeaning(sourceInput);

      const editorial = draft.generated.about?.trim() && draft.generated.whenToListen?.trim()
        ? { about: draft.generated.about, whenToListen: draft.generated.whenToListen }
        : await this.generation.generateEditorialMetadata({
            ...sourceInput,
            songName: draft.identity.songName,
            artistNames: draft.artists.map(artist => artist.name),
            romanizedLines: generatedLines(draft.generated.romanized!),
            meaningLines: meaning.lines,
          });

      const generatedPatch = {
        ...(draft.generated.meaning?.trim() ? {} : { meaning: joinGeneratedLines(meaning.lines) }),
        ...(draft.generated.about?.trim() ? {} : { about: editorial.about }),
        ...(draft.generated.whenToListen?.trim() ? {} : { whenToListen: editorial.whenToListen }),
      };

      if (Object.keys(generatedPatch).length > 0) {
        await this.drafts.update(draft.id, draft.revision, { generated: generatedPatch }, updatedBy);
      }

      const completedDraft = await this.drafts.getByIngestionId(initial.id);
      if (!completeAiContent(completedDraft)) throw new IncompleteAiGenerationError();

      const quality = evaluateCompleteGeneratedContent(completedDraft.generated);
      if (!quality.valid) throw new GeneratedContentQualityError(quality.issues);

      const latest = await this.ingestions.getById(initial.id);
      await this.ingestions.transition(latest.id, latest.revision, "ready_for_review", updatedBy);

      return {
        ingestion: await this.ingestions.getById(initial.id),
        draft: completedDraft,
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
