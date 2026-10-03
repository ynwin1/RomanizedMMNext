import { AdminListQuerySchema, type AdminListQuery } from "@/shared/admin-list";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminArtistRecord } from "./artist.dto";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { ArtistCataloguePage } from "./artist.dto";
import { ArtistEntity, CreateArtistInput } from "../domain/artist.types";
import { IArtistRepository } from "./artist.repository";

export class ArtistService {
  constructor(private readonly artists: IArtistRepository) {}

  async getAdminList(input: unknown = {}): Promise<AdminPage<AdminArtistRecord>> {
    const query = AdminListQuerySchema.parse(input);
    return this.artists.listAdmin(query);
  }

  async getAdminCount(): Promise<number> {
    
    return this.artists.countAdmin();
  }

  async getBySlug(slug: string): Promise<ArtistEntity> {
    const artist = await this.artists.findBySlug(slug);
    if (!artist) {
      throw new NotFoundError(`Artist with slug ${slug} was not found`, "ARTIST_NOT_FOUND");
    }
    return artist;
  }

  async getCatalogue(page: number, limit: number): Promise<ArtistCataloguePage> {
    return this.artists.listCatalogue(page, limit);
  }

  async getFirstProfileBySlugs(slugs: string[]): Promise<ArtistEntity | null> {
    return this.artists.findFirstBySlugs(slugs);
  }

  async createArtist(input: CreateArtistInput): Promise<ArtistEntity> {
    return this.artists.create(input);
  }
}
