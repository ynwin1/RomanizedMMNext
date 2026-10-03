import { AdminListQuerySchema } from "@/shared/admin-list";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminArtistRecord, ArtistCataloguePage, ArtistEditRecord } from "./artist.dto";
import { NotFoundError } from "@/shared/errors/not-found.error";
import type { ArtistEntity } from "../domain/artist.types";
import { IArtistRepository } from "./artist.repository";
import { ArtistContentSchema, ArtistRevisionSchema, ArtistSlugSchema, CreateArtistSchema } from "./artist.validation";
import { ArtistConflictError } from "./artist-write.error";

export class ArtistService {
  constructor(private readonly artists: IArtistRepository) {}

  async createArtist(input: unknown): Promise<ArtistEntity> {
    return this.artists.create(CreateArtistSchema.parse(input));
  }

  async getArtistForEdit(slug: unknown): Promise<ArtistEditRecord> {
    const artist = await this.artists.findForEdit(ArtistSlugSchema.parse(slug));
    if (!artist) throw new NotFoundError("Artist not found", "ARTIST_NOT_FOUND");
    return artist;
  }

  async updateArtist(slug: unknown, revision: unknown, input: unknown): Promise<ArtistEntity> {
    const artistSlug = ArtistSlugSchema.parse(slug);
    const expectedRevision = ArtistRevisionSchema.parse(revision);
    const content = ArtistContentSchema.parse(input);
    const artist = await this.artists.update(artistSlug, expectedRevision, content);
    if (artist) return artist;
    if (!(await this.artists.findBySlug(artistSlug))) throw new NotFoundError("Artist not found", "ARTIST_NOT_FOUND");
    throw new ArtistConflictError();
  }

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
}
