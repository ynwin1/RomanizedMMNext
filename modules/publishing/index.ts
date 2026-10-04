import { artistService } from "@/modules/artists";
import { contentDraftService } from "@/modules/content-drafts";
import { ingestionService } from "@/modules/ingestions";
import { songRequestService } from "@/modules/requests";
import { songService } from "@/modules/songs";
import { PublishingService } from "./application/publishing.service";

export const publishingService = new PublishingService(
  ingestionService,
  contentDraftService,
  songService,
  artistService,
  songRequestService,
);

export * from "./application/publishing.error";
export * from "./application/publishing.service";
