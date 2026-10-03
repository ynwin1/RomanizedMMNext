import { adminPage, type AdminPage, type AdminListQuery } from "@/shared/admin-list";
import { literalSearch } from "@/shared/literal-search";
import type { AdminArtistRecord, ArtistCataloguePage, ArtistCatalogueRecord, ArtistEditRecord } from "../application/artist.dto";
import connectDB from "@/infrastructure/database/mongodb";
import Artist, { type IArtist } from "./artist.model";
import { IArtistRepository } from "../application/artist.repository";
import type { ArtistEntity } from "../domain/artist.types";
import type { ArtistContentInput, CreateArtistInput } from "../application/artist.validation";
import { DuplicateArtistError } from "../application/artist-write.error";

type ArtistPersistenceRecord = Pick<IArtist, Exclude<keyof ArtistEntity, "id">> & { _id?: unknown };

function toEntity(artist: ArtistPersistenceRecord): ArtistEntity {
  return {
    id: artist._id == null ? "" : String(artist._id),
    name: artist.name,
    slug: artist.slug,
    imageLink: artist.imageLink,
    bannerLink: artist.bannerLink,
    biography: artist.biography,
    biographyMy: artist.biographyMy,
    unknownFact: artist.unknownFact,
    type: artist.type,
    members: artist.members,
    origin: artist.origin,
    labels: artist.labels,
    musicGenre: artist.musicGenre ?? [],
    songs: artist.songs ?? [],
    socials: artist.socials,
    likes: artist.likes ?? 0,
  };
}

export class MongoArtistRepository implements IArtistRepository {
  async create(input: CreateArtistInput): Promise<ArtistEntity> {
    await connectDB();
    try {
      const artist = await Artist.create(input);
      return toEntity(artist.toObject());
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000 &&
          "keyPattern" in error && typeof error.keyPattern === "object" && error.keyPattern !== null && "slug" in error.keyPattern) {
        throw new DuplicateArtistError();
      }
      throw error;
    }
  }

  async findForEdit(slug: string): Promise<ArtistEditRecord | null> {
    await connectDB();
    const artist = await Artist.findOne({ slug }).lean();
    return artist ? { ...toEntity(artist), revision: artist.__v ?? 0 } : null;
  }

  async update(slug: string, revision: number, input: ArtistContentInput): Promise<ArtistEntity | null> {
    await connectDB();
    const optionalFields = ["bannerLink", "biography", "biographyMy", "unknownFact", "members", "origin", "labels", "socials"] as const;
    const unset: Record<string, 1> = {};
    const set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) if (value !== undefined) set[key] = value;
    for (const key of optionalFields) if (input[key] === undefined) unset[key] = 1;

    const versionFilter = revision === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: revision };
    const artist = await Artist.findOneAndUpdate(
      { slug, ...versionFilter },
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}), $inc: { __v: 1 } },
      { new: true, runValidators: true, upsert: false },
    ).lean();

    return artist ? toEntity(artist) : null;
  }

  async countAdmin(): Promise<number> {
    await connectDB();
    return Artist.countDocuments({});
  }

  async listAdmin(query: AdminListQuery): Promise<AdminPage<AdminArtistRecord>> {
    await connectDB();
    const filter = query.q ? { $or: [{ name: literalSearch(query.q) }, { slug: literalSearch(query.q) }] } : {};
    const [rows, total] = await Promise.all([
      Artist.find(filter).sort({ name: 1, _id: 1 }).skip((query.page - 1) * query.limit)
        .limit(query.limit).select("name slug type musicGenre songs -_id").lean(),
      Artist.countDocuments(filter),
    ]);
    return adminPage(rows.map(row => ({
      name: row.name,
      slug: row.slug,
      type: row.type,
      musicGenre: row.musicGenre ?? [],
      songCount: row.songs?.length ?? 0,
    })), total, query);
  }

  async findBySlug(slug: string): Promise<ArtistEntity | null> {
    await connectDB();
    const artist = await Artist.findOne({ slug }).lean();
    return artist ? toEntity(artist) : null;
  }

  async findFirstBySlugs(slugs: string[]): Promise<ArtistEntity | null> {
    if (slugs.length === 0) return null;

    await connectDB();
    const artists = await Artist.find({ slug: { $in: slugs } }).lean();
    const bySlug = new Map(artists.map(artist => [artist.slug, artist]));

    for (const slug of slugs) {
      const artist = bySlug.get(slug);
      if (artist) return toEntity(artist);
    }
    return null;
  }

  async listCatalogue(page: number, limit: number): Promise<ArtistCataloguePage> {
    await connectDB();
    const [artists, totalArtistCount] = await Promise.all([
      Artist.find({})
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("name slug imageLink musicGenre type songs biography -_id")
        .lean(),
      Artist.countDocuments({}),
    ]);

    return {
      artists: artists as ArtistCatalogueRecord[],
      totalPages: Math.ceil(totalArtistCount / limit),
    };
  }
}
