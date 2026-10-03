import connectDB from "@/infrastructure/database/mongodb";
import Artist from "./artist.model";
import { ArtistEntity, CreateArtistInput } from "../domain/artist.types";
import { ArtistCataloguePage, ArtistCatalogueRecord } from "../application/artist.dto";

function toEntity(artist: any): ArtistEntity {
  return {
    id: artist._id?.toString?.() ?? "",
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

export interface IArtistRepository {
  findBySlug(slug: string): Promise<ArtistEntity | null>;
  findFirstBySlugs(slugs: string[]): Promise<ArtistEntity | null>;
  listCatalogue(page: number, limit: number): Promise<ArtistCataloguePage>;
  create(input: CreateArtistInput): Promise<ArtistEntity>;
}

export class MongoArtistRepository implements IArtistRepository {
  async findBySlug(slug: string): Promise<ArtistEntity | null> {
    await connectDB();
    const artist = await Artist.findOne({ slug }).lean();
    return artist ? toEntity(artist) : null;
  }

  async findFirstBySlugs(slugs: string[]): Promise<ArtistEntity | null> {
    if (slugs.length === 0) {
      return null;
    }

    await connectDB();
    const artists = await Artist.find({ slug: { $in: slugs } }).lean();
    const bySlug = new Map(artists.map(artist => [artist.slug, artist]));

    for (const slug of slugs) {
      const artist = bySlug.get(slug);
      if (artist) {
        return toEntity(artist);
      }
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

  async create(input: CreateArtistInput): Promise<ArtistEntity> {
    await connectDB();
    const artist = await Artist.create(input);
    return toEntity(artist.toObject());
  }
}
