import connectDB from "@/infrastructure/database/mongodb";
import {Types} from "mongoose";
import type {IPlaylistRepository, PlaylistWrite} from "../application/playlist.repository";
import type {PlaylistEntity, PlaylistGenre, PlaylistPlatform, PlaylistStatus} from "../domain/playlist.types";
import {DuplicatePlaylistError} from "../application/playlist-write.error";
import Playlist, {type IPlaylist} from "./playlist.model";

type PersistedPlaylist = IPlaylist & {_id?: unknown};

function toEntity(row: PersistedPlaylist): PlaylistEntity {
  return {
    id: row._id == null ? "" : String(row._id),
    platform: row.platform,
    platformPlaylistId: row.platformPlaylistId,
    url: row.url,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    curator: row.curator,
    genres: row.genres,
    status: row.status,
    sortOrder: row.sortOrder,
    revision: row.__v ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

function translateDuplicate(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000 &&
      "keyPattern" in error && typeof error.keyPattern === "object" && error.keyPattern !== null &&
      "platform" in error.keyPattern && "platformPlaylistId" in error.keyPattern) {
    throw new DuplicatePlaylistError();
  }
  throw error;
}

export class MongoPlaylistRepository implements IPlaylistRepository {
  async create(input: PlaylistWrite, updatedBy?: string): Promise<PlaylistEntity> {
    await connectDB();
    try {
      const record = await Playlist.create({...input, status: "draft", ...(updatedBy ? {updatedBy} : {})});
      return toEntity(record.toObject());
    } catch (error) { translateDuplicate(error); }
  }

  async findById(id: string): Promise<PlaylistEntity | null> {
    await connectDB();
    const row = await Playlist.findById(new Types.ObjectId(id)).lean();
    return row ? toEntity(row) : null;
  }

  async findByPlatformId(platform: PlaylistPlatform, platformPlaylistId: string): Promise<PlaylistEntity | null> {
    await connectDB();
    const row = await Playlist.findOne({platform, platformPlaylistId}).lean();
    return row ? toEntity(row) : null;
  }

  async listAdmin(): Promise<PlaylistEntity[]> {
    await connectDB();
    const rows = await Playlist.find({}).sort({updatedAt: -1, _id: -1}).lean();
    return rows.map(toEntity);
  }

  async listPublishedByGenre(genre: PlaylistGenre, limit: number): Promise<PlaylistEntity[]> {
    await connectDB();
    const rows = await Playlist.find({status: "published", genres: genre})
      .sort({sortOrder: 1, createdAt: -1, _id: 1}).limit(limit).lean();
    return rows.map(toEntity);
  }

  async update(id: string, revision: number, input: PlaylistWrite, updatedBy?: string): Promise<PlaylistEntity | null> {
    await connectDB();
    const unset: Record<string, 1> = {};
    for (const field of ["description", "imageUrl", "curator"] as const) if (input[field] === undefined) unset[field] = 1;
    const version = revision === 0 ? {$or: [{__v: 0}, {__v: {$exists: false}}]} : {__v: revision};
    try {
      const row = await Playlist.findOneAndUpdate(
        {_id: new Types.ObjectId(id), ...version},
        {$set: {...input, ...(updatedBy ? {updatedBy} : {})}, ...(Object.keys(unset).length ? {$unset: unset} : {}), $inc: {__v: 1}},
        {new: true, runValidators: true, upsert: false},
      ).lean();
      return row ? toEntity(row) : null;
    } catch (error) { translateDuplicate(error); }
  }

  async setStatus(id: string, revision: number, status: PlaylistStatus, updatedBy?: string): Promise<PlaylistEntity | null> {
    await connectDB();
    const version = revision === 0 ? {$or: [{__v: 0}, {__v: {$exists: false}}]} : {__v: revision};
    const row = await Playlist.findOneAndUpdate(
      {_id: new Types.ObjectId(id), ...version},
      {$set: {status, ...(updatedBy ? {updatedBy} : {})}, $inc: {__v: 1}},
      {new: true, runValidators: true, upsert: false},
    ).lean();
    return row ? toEntity(row) : null;
  }
}
