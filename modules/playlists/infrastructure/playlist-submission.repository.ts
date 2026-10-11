import {Types} from "mongoose";
import connectDB from "@/infrastructure/database/mongodb";
import {PlaylistSubmission} from "./playlist-submission.model";
import type {PlaylistSubmissionInput} from "../application/playlist-submission";

export async function createPlaylistSubmission(input: PlaylistSubmissionInput) {
  await connectDB();
  const existing = await PlaylistSubmission.findOne({playlistId: input.playlistId, genre: input.genre, status: {$in: ["pending", "approved"]}}).lean();
  if (existing) return {created: false, id: String(existing._id)};
  try {
    const created = await PlaylistSubmission.create({...input, status: "pending"});
    return {created: true, id: String(created._id)};
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) return {created: false, id: ""};
    throw error;
  }
}

export async function listPlaylistSubmissions() {
  await connectDB();
  const rows = await PlaylistSubmission.find({}).sort({createdAt: -1}).limit(200).lean();
  return rows.map(row => ({
    id: String(row._id), playlistId: row.playlistId, url: row.url, genre: row.genre,
    status: row.status, playlistRecordId: row.playlistRecordId,
    createdAt: row.createdAt?.toISOString() ?? "",
  }));
}

export async function getPendingPlaylistSubmission(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  return PlaylistSubmission.findOne({_id: new Types.ObjectId(id), status: "pending"}).lean();
}

export async function decidePlaylistSubmission(id: string, decision: "approved" | "rejected", playlistRecordId?: string) {
  if (!Types.ObjectId.isValid(id)) return false;
  await connectDB();
  const result = await PlaylistSubmission.updateOne({_id: new Types.ObjectId(id), status: "pending"},
    {$set: {status: decision, ...(playlistRecordId ? {playlistRecordId} : {})}});
  return result.modifiedCount === 1;
}
