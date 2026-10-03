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
    createdAt: song.createdAt,
    isRequested: song.isRequested,
    requestedBy: song.requestedBy,
    songStoryEn: song.songStoryEn,
    songStoryMy: song.songStoryMy,
  };
}

export class MongoSongRepository implements ISongRepository {
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
