import type { AdminListQuery } from "@/shared/admin-list";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminArtistRecord, ArtistCataloguePage, ArtistEditRecord } from "./artist.dto";
import type { ArtistEntity } from "../domain/artist.types";
import type { ArtistContentInput, CreateArtistInput } from "./artist.validation";

export interface IArtistRepository {
  listAdmin(query: AdminListQuery): Promise<AdminPage<AdminArtistRecord>>;
  countAdmin(): Promise<number>;
  findBySlug(slug: string): Promise<ArtistEntity | null>;
  findForEdit(slug: string): Promise<ArtistEditRecord | null>;
  findFirstBySlugs(slugs: string[]): Promise<ArtistEntity | null>;
  listCatalogue(page: number, limit: number): Promise<ArtistCataloguePage>;
  create(input: CreateArtistInput, updatedBy?: string): Promise<ArtistEntity>;
  update(slug: string, revision: number, input: ArtistContentInput, updatedBy?: string): Promise<ArtistEntity | null>;
}
