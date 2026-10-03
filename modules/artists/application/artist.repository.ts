import { ArtistEntity, CreateArtistInput } from "../domain/artist.types";
import { ArtistCataloguePage } from "./artist.dto";

export interface IArtistRepository {
  findBySlug(slug: string): Promise<ArtistEntity | null>;
  findFirstBySlugs(slugs: string[]): Promise<ArtistEntity | null>;
  listCatalogue(page: number, limit: number): Promise<ArtistCataloguePage>;
  create(input: CreateArtistInput): Promise<ArtistEntity>;
}
