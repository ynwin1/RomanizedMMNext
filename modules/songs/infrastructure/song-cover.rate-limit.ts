import { createHmac } from "node:crypto";
import mongoose, { Schema, models, type Model } from "mongoose";
import connectDB from "@/infrastructure/database/mongodb";

export const COVER_WINDOW_MS = 60 * 60 * 1000;
export const COVER_IP_LIMIT = 8;
export const COVER_GLOBAL_LIMIT = 500;

interface RateBucket {
  _id: string;
  count: number;
  expiresAt: Date;
}

const schema = new Schema<RateBucket>({
  _id: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
}, { versionKey: false, collection: "coverSubmissionRateBuckets" });
// TTL cleanup may lag; the window is encoded in the bucket ID regardless.
schema.index({expiresAt: 1}, {expireAfterSeconds: 0});
const Bucket: Model<RateBucket> = (models.CoverSubmissionRateBucket as Model<RateBucket> | undefined)
  ?? mongoose.model<RateBucket>("CoverSubmissionRateBucket", schema);

/**
 * Accept client identity only from the platform-provided forwarding header.
 * Unknown origins share a bucket instead of trusting a user-supplied IP string.
 */
export function coverRateIdentity(request: Request, secret: string): string {
  const fromPlatform = request.headers.get("x-vercel-forwarded-for")?.split(",").at(0)?.trim();
  const ip = fromPlatform && fromPlatform.length <= 64 ? fromPlatform : "unknown";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function coverRateWindow(now: number) {
  const start = Math.floor(now / COVER_WINDOW_MS) * COVER_WINDOW_MS;
  return {start, expiresAt: new Date(start + COVER_WINDOW_MS + 60_000),
    retryAfterSeconds: Math.max(1, Math.ceil((start + COVER_WINDOW_MS - now) / 1000))};
}

/**
 * A unique bucket per actor and global window. A conditional atomic upsert
 * rejects requests above the limit, including simultaneous requests.
 */
export async function consumeCoverRateBucket(key: string, limit: number, expiresAt: Date): Promise<boolean> {
  await connectDB();
  try {
    await Bucket.findOneAndUpdate(
      { _id: key, count: { $lt: limit } },
      { $inc: {count: 1}, $setOnInsert: {expiresAt} },
      { upsert: true, new: true, runValidators: true },
    );
    return true;
  } catch (error) {
    // When an existing bucket is full, upserting its ID races the unique _id.
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return false;
    }
    throw error;
  }
}

export async function enforceCoverSubmissionRate(request: Request, now = Date.now()) {
  const secret = process.env.COVER_RATE_LIMIT_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error("Cover rate-limit secret is not configured");
  const {start, expiresAt, retryAfterSeconds} = coverRateWindow(now);
  const actor = coverRateIdentity(request, secret);
  // Global cap additionally protects against distributed or spoofed traffic.
  const globalAllowed = await consumeCoverRateBucket(`cover:global:${start}`, COVER_GLOBAL_LIMIT, expiresAt);
  if (!globalAllowed) return {allowed: false, retryAfterSeconds};
  const actorAllowed = await consumeCoverRateBucket(`cover:actor:${actor}:${start}`, COVER_IP_LIMIT, expiresAt);
  return {allowed: actorAllowed, retryAfterSeconds};
}
