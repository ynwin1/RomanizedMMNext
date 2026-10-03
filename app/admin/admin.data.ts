import { requireAdmin } from "@/infrastructure/auth";
import { songService } from "@/modules/songs";
import { artistService } from "@/modules/artists";
import { songRequestService } from "@/modules/requests";
import { AdminReadService } from "@/modules/admin";

export const adminReads = new AdminReadService(requireAdmin, songService, artistService, songRequestService);
