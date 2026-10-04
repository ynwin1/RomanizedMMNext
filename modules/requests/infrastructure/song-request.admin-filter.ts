import type { FilterQuery } from "mongoose";
import type { ISongRequest } from "./song-request.model";
import type { SongRequestStatus } from "../domain/song-request.types";
import { literalSearch } from "@/shared/literal-search";

export function requestAdminFilter(q: string, status?: SongRequestStatus): FilterQuery<ISongRequest> {
  const filters: FilterQuery<ISongRequest>[] = [];
  if (q) filters.push({ $or: [{ songName: literalSearch(q) }, { artist: literalSearch(q) }] });
  if (status === "pending") {
    filters.push({
      $or: [
        { status: { $in: ["pending", "reviewing"] } },
        { status: { $exists: false } },
        { status: null },
      ],
    });
  } else if (status === "completed") {
    filters.push({ status: { $in: ["completed", "added"] } });
  } else if (status) {
    filters.push({ status });
  }
  return filters.length ? { $and: filters } : {};
}
