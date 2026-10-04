import type { CreateSongInput, SongContentInput } from "../application/song.validation";
import type { SongEditRecord } from "../application/song.dto";
import { DuplicatePublishedSongError, DuplicateSongError } from "../application/song-write.error";
import { adminPage, type AdminPage, type AdminListQuery } from "@/shared/admin-list";
import { literalSearch } from "@/shared/literal-search";
import type { AdminSongRecord } from "../application/song.dto";
import connectDB from "@/infrastructure/database/mongodb";
import Song, { type ISong } from "./song.model";
import { ISongRepository } from "../application/song.repository";
import { SongEntity } from "../domain/song.types";
import {
  GuessLyricsSong,
  GuessSongRecord,
  RandomSongResult,
  SitemapSongRecord,
  SongCatalogueRecord,
  SongSearchResult,
  SongSummary,
} from "../application/song.dto";

type SongPersistenceRecord = Pick<ISong, Exclude<keyof SongEntity, "id">> & { _id?: unknown };

function toEntity(song: SongPersistenceRecord): SongEntity {
  return {
    id: song._id == null ? "" : String(song._id),
    mmid: song.mmid,
    songName: song.songName,
    artistName: song.artistName ?? [],
    albumName: song.albumName,
    genre: song.genre,
    spotifyTrackId: song.spotifyTrackId,
    spotifyLink: song.spotifyLink,
    appleMusicLink: song.appleMusicLink,
    youtubeLink: song.youtubeLink,
    imageLink: song.imageLink,
    about: song.about,
    whenToListen: song.whenToListen,
    lyrics: song.lyrics,
    romanized: song.romanized,
    burmese: song.burmese,
    meaning: song.meaning,
    lyricsV2: song.lyricsV2,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
    updatedBy: song.updatedBy,
    isRequested: song.isRequested,
    requestedBy: song.requestedBy,
    songStoryEn: song.songStoryEn,
    songStoryMy: song.songStoryMy,
  };
}

export class MongoSongRepository implements ISongRepository {
  async create(input: CreateSongInput, updatedBy?: string): Promise<SongEntity> {
    await connectDB();
    try {
      const song = await Song.create({ ...input, ...(updatedBy ? { updatedBy } : {}) });
      return toEntity(song.toObject());
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000 &&
        "keyPattern" in error &&
        typeof error.keyPattern === "object" &&
        error.keyPattern !== null &&
        "mmid" in error.keyPattern
      ) {
        throw new DuplicateSongError();
      }
      throw error;
    }
  }

  async createPublished(
    input: CreateSongInput,
    sourceIngestionId: string,
    updatedBy?: string,
  ): Promise<SongEntity> {
    await connectDB();
    try {
      const song = await Song.create({
        ...input,
        sourceIngestionId,
        ...(updatedBy ? { updatedBy } : {}),
      });
      return toEntity(song.toObject());
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000 &&
        "keyPattern" in error &&
        typeof error.keyPattern === "object" &&
        error.keyPattern !== null
      ) {
        if ("sourceIngestionId" in error.keyPattern) throw new DuplicatePublishedSongError();
        if ("mmid" in error.keyPattern) throw new DuplicateSongError();
      }
      throw error;
    }
  }

  async findBySourceIngestionId(sourceIngestionId: string): Promise<SongEntity | null> {
    await connectDB();
    const song = await Song.findOne({ sourceIngestionId }).lean();
    return song ? toEntity(song) : null;
  }

  async nextMmid(): Promise<number> {
    await connectDB();
    const latest = await Song.findOne({}).sort({ mmid: -1 }).select("mmid -_id").lean();
    return (latest?.mmid ?? 0) + 1;
  }

  async findForEdit(mmid: number): Promise<SongEditRecord | null> {
    await connectDB();
    const song = await Song.findOne({ mmid }).lean();
    return song ? { ...toEntity(song), revision: song.__v ?? 0 } : null;
  }

  async update(mmid: number, revision: number, input: SongContentInput, updatedBy?: string): Promise<SongEntity | null> {
    await connectDB();
    const optionalFields = ["albumName", "spotifyTrackId", "spotifyLink", "appleMusicLink", "youtubeLink", "imageLink", "requestedBy", "songStoryEn", "songStoryMy"] as const;
    const unset: Record<string, 1> = {};
    const set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) if (value !== undefined) set[key] = value;
    for (const key of optionalFields) if (input[key] === undefined) unset[key] = 1;
    if (updatedBy) set.updatedBy = updatedBy;
    const versionFilter = revision === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: revision };
    const song = await Song.findOneAndUpdate(
      { mmid, ...versionFilter },
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}), $inc: { __v: 1 } },
      { new: true, runValidators: true, upsert: false },
    ).lean();
    return song ? toEntity(song) : null;
  }

  async countAdmin(): Promise<number> {
    await connectDB();
    return Song.countDocuments({});
  }

  async listAdmin(query: AdminListQuery): Promise<AdminPage<AdminSongRecord>> {
    await connectDB();
    const filter = query.q ? { $or: [{ "songName": literalSearch(query.q) }, { "artistName.name": literalSearch(query.q) }] } : {};
    const [rows, total] = await Promise.all([
      Song.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit)
        .limit(query.limit).select("mmid songName artistName genre createdAt -_id").lean(),
      Song.countDocuments(filter),
    ]);
    return adminPage(rows.map(row => ({ mmid: row.mmid, songName: row.songName, artistName: row.artistName ?? [], genre: row.genre, createdAt: row.createdAt })), total, query);
  }

  async findByMmid(mmid: number): Promise<SongEntity | null> {
    await connectDB();
    const song = await Song.findOne({ mmid }).lean();
    return song ? toEntity(song) : null;
  }

  async searchByTitle(query: string): Promise<SongSearchResult[]> {
    await connectDB();
    return Song.find({
      songName: { $regex: query, $options: "i" },
    })
      .sort({ songName: 1 })
      .select("songName mmid artistName -_id")
      .lean();
  }

  async findRandom(): Promise<RandomSongResult | null> {
    await connectDB();
    const songs = await Song.aggregate([
      { $sample: { size: 1 } },
      { $project: { _id: 0, songName: 1, mmid: 1 } },
    ]);
    return songs[0] ?? null;
  }

  async findLatest(limit: number): Promise<SongSummary[]> {
    await connectDB();
    return Song.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("mmid songName artistName imageLink createdAt -_id")
      .lean();
  }

  async findByMmids(mmids: number[]): Promise<SongEntity[]> {
    await connectDB();
    const songs = await Song.find({ mmid: { $in: mmids } }).lean();
    return songs.map(toEntity);
  }

  async listForSitemap(): Promise<SitemapSongRecord[]> {
    await connectDB();
    const songs = await Song.find().select("mmid songName -_id").lean();
    return songs.map(song => ({
      mmid: song.mmid,
      songName: song.songName.split("(")[0].trim().replace(/\s/g, ""),
    }));
  }

  async listCatalogue(): Promise<SongCatalogueRecord[]> {
    await connectDB();
    return Song.find({})
      .select("songName artistName mmid imageLink -_id")
      .lean();
  }

  async listGuessLyricsSongs(): Promise<GuessLyricsSong[]> {
    await connectDB();
    return Song.find({})
      .select("songName romanized burmese -_id")
      .lean();
  }

  async listGuessSongRecords(): Promise<GuessSongRecord[]> {
    await connectDB();
    return Song.find({})
      .select("songName youtubeLink mmid -_id")
      .lean();
  }

  async findByArtistName(artistName: string): Promise<SongEntity[]> {
    await connectDB();
    const songs = await Song.find({
      "artistName.name": { $regex: artistName, $options: "i" },
    })
      .sort({ songName: 1 })
      .lean();
    return songs.map(toEntity);
  }
}
