"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/infrastructure/auth";
import { logger } from "@/infrastructure/logging/logger";
import { artistService } from "@/modules/artists";
import { songService } from "@/modules/songs";
import { contentDraftService } from "@/modules/content-drafts";
import { ContentGenerationService } from "@/modules/content-generation";
import {
  ingestionService,
  ingestionWorkflowService,
  IngestionArtistResolutionService,
  IngestionGenerationService,
  IngestionMetadataService,
  IngestionReviewService,
} from "@/modules/ingestions";
import { publishingService } from "@/modules/publishing";
import { createOpenAIContentGenerationAdapter } from "@/integrations/ai/openai-content-generation.adapter";
import { createRecentSongRomanizationReferenceProvider } from "@/integrations/romanization-references/recent-song-reference.provider";
import { createIngestionActionHandler, type IngestionActionState } from "./ingestion-action-handler";

async function generateAiContent(ingestionId: string, updatedBy: string) {
  const generation = new ContentGenerationService(createOpenAIContentGenerationAdapter());
  const references = createRecentSongRomanizationReferenceProvider(songService);
  const workflow = new IngestionGenerationService(
    ingestionService,
    contentDraftService,
    generation,
    references,
  );
  return workflow.generateAll(ingestionId, updatedBy);
}

async function saveMetadata(
  ingestionId: string,
  input: Parameters<IngestionMetadataService["save"]>[1],
  updatedBy: string,
) {
  return new IngestionMetadataService(ingestionService, contentDraftService)
    .save(ingestionId, input, updatedBy);
}

async function saveReview(
  ingestionId: string,
  input: Parameters<IngestionReviewService["save"]>[1],
  updatedBy: string,
) {
  return new IngestionReviewService(ingestionService, contentDraftService)
    .save(ingestionId, input, updatedBy);
}

function artistWorkflow() {
  return new IngestionArtistResolutionService(
    ingestionService,
    contentDraftService,
    artistService,
  );
}

const actions = createIngestionActionHandler({
  authorize: requireAdmin,
  workflow: ingestionWorkflowService,
  generateAiContent,
  saveMetadata,
  saveReview,
  publishSong: (ingestionId, updatedBy) =>
    publishingService.publish(ingestionId, updatedBy),
  resolveArtist: (ingestionId, input, updatedBy) =>
    artistWorkflow().resolve(ingestionId, input, updatedBy),
  addArtist: (ingestionId, input, updatedBy) =>
    artistWorkflow().add(ingestionId, input, updatedBy),
  removeArtist: (ingestionId, input, updatedBy) =>
    artistWorkflow().remove(ingestionId, input, updatedBy),
  confirmArtists: (ingestionId, input, updatedBy) =>
    artistWorkflow().confirm(ingestionId, input, updatedBy),
  started(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId);
  },
  aiGenerated(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?aiGenerated=1");
  },
  generationFailed(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?generationFailed=1");
  },
  metadataSaved(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?metadataSaved=1");
  },
  reviewSaved(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?reviewSaved=1");
  },
  published(song) {
    revalidatePath("/admin", "layout");
    revalidatePath("/en", "layout");
    const name = song.songName.split("(")[0].trim().replace(/\s/g, "");
    redirect("/en/song/" + encodeURIComponent(name || "song") + "/" + song.mmid);
  },
  artistChanged(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId + "?artistChanged=1");
  },
  artistsConfirmed(ingestionId) {
    revalidatePath("/admin", "layout");
    redirect("/admin/ingestions/" + ingestionId);
  },
  logFailure(error) {
    logger.error("Admin ingestion workflow failed", error);
  },
});

export async function startIngestionAction(
  requestId: string,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.start(requestId, previous, form);
}

export async function saveIngestionSourceAction(
  ingestionId: string,
  ingestionRevision: number,
  draftRevision: number,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.saveSource(ingestionId, ingestionRevision, draftRevision, previous, form);
}

export async function generateAiContentAction(
  ingestionId: string,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.generateAiContent(ingestionId, previous, form);
}

export async function saveIngestionReviewAction(
  ingestionId: string,
  draftId: string,
  draftRevision: number,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.saveReview(ingestionId, draftId, draftRevision, previous, form);
}

export async function saveIngestionMetadataAction(
  ingestionId: string,
  draftId: string,
  draftRevision: number,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.saveMetadata(ingestionId, draftId, draftRevision, previous, form);
}

export async function resolveDraftArtistAction(
  ingestionId: string,
  draftId: string,
  draftRevision: number,
  artistIndex: number,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.resolveArtist(ingestionId, draftId, draftRevision, artistIndex, previous, form);
}

export async function addDraftArtistAction(
  ingestionId: string,
  draftId: string,
  draftRevision: number,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.addArtist(ingestionId, draftId, draftRevision, previous, form);
}

export async function removeDraftArtistAction(
  ingestionId: string,
  draftId: string,
  draftRevision: number,
  artistIndex: number,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.removeArtist(ingestionId, draftId, draftRevision, artistIndex, previous, form);
}

export async function confirmDraftArtistsAction(
  ingestionId: string,
  draftId: string,
  previous: IngestionActionState,
  form: FormData,
) {
  return actions.confirmArtists(ingestionId, draftId, previous, form);
}
