import type { FilterQuery } from "mongoose";
import type { ISongRequest } from "./song-request.model";
import { literalSearch } from "@/shared/literal-search";

export function requestAdminFilter(q: string, status?: "pending" | "added"): FilterQuery<ISongRequest> {
  const filters: FilterQuery<ISongRequest>[] = [];
  if (q) filters.push({ $or: [{ songName: literalSearch(q) }, { artist: literalSearch(q) }] });
  // Legacy requests without a status are pending, matching the schema's default.
  if (status === "pending") filters.push({ $or: [{ status: "pending" }, { status: { $exists: false } }, { status: null }] });
  if (status === "added") filters.push({ status: "added" });
  return filters.length ? { $and: filters } : {};
}
