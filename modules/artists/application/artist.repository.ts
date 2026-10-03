import { AdminListQuerySchema, type AdminListQuery } from "@/shared/admin-list";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminArtistRecord } from "./artist.dto";
import { ArtistEntity, CreateArtistInput } from "../domain/artist.types";
import { ArtistCataloguePage } from "./artist.dto";

export interface IArtistRepository {
  listAdmin(query: AdminListQuery): Promise<AdminPage<AdminArtistRecord>>;
  countAdmin(): Promise<number>;
  findBySlug(slug: string): Promise<ArtistEntity | null>;
  findFirstBySlugs(slugs: string[]): Promise<ArtistEntity | null>;
  listCatalogue(page: number, limit: number): Promise<ArtistCataloguePage>;
  create(input: CreateArtistInput): Promise<ArtistEntity>;
}
