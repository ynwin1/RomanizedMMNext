import mongoose, { Schema } from "mongoose";
import { z } from "zod";
import connectDB from "@/infrastructure/database/mongodb";
import { logger } from "@/infrastructure/logging/logger";
import { AdminSongGenerationService, AdminSongGenerationInputSchema } from "@/modules/admin/application/admin-song-generation.service";
import { createCatalogueContentGenerationService } from "@/integrations/ai/create-catalogue-content-generation.service";

export type GenerationInput = z.infer<typeof AdminSongGenerationInputSchema>;
export type GenerationResult = Awaited<ReturnType<AdminSongGenerationService["generate"]>>;
export interface GenerationJob {
  _id: string;
  owner: string;
  input: GenerationInput;
  status: "queued" | "running" | "completed" | "failed";
  generated?: GenerationResult;
  message?: string;
  startedAt?: Date;
}

const schema = new Schema<GenerationJob>({
  _id: { type: String, required: true },
  owner: { type: String, required: true },
  input: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ["queued", "running", "completed", "failed"], required: true },
  generated: Schema.Types.Mixed,
  message: String,
  startedAt: Date,
}, { timestamps: true });
const Job = mongoose.models.SongGenerationJob as mongoose.Model<GenerationJob>
  || mongoose.model<GenerationJob>("SongGenerationJob", schema);

export interface GenerationJobStore {
  claim(id: string, owner: string): Promise<GenerationJob | null>;
  complete(id: string, owner: string, generated: GenerationResult): Promise<void>;
  fail(id: string, owner: string, message: string): Promise<void>;
}

// An atomic claim prevents repeated polling and retries from starting duplicate AI calls.
export async function executeGenerationJob(
  id: string,
  owner: string,
  store: GenerationJobStore,
  generate: (input: GenerationInput) => Promise<GenerationResult>,
) {
  const job = await store.claim(id, owner);
  if (!job) return;
  const startedAt = Date.now();
  try {
    const generated = await generate(job.input);
    await store.complete(id, owner, generated);
    logger.info("Admin direct song AI generation completed", { requestId: id, elapsedMs: Date.now() - startedAt });
  } catch (error) {
    logger.error("Admin direct song AI generation failed", error, { requestId: id });
    await store.fail(id, owner, "Generation stopped before the result could be saved. Please try again.");
  }
}

export async function createGenerationJob(id: string, owner: string, input: GenerationInput) {
  await connectDB();
  // $setOnInsert makes a repeated start with the same ID safe after a lost response.
  await Job.updateOne({ _id: id, owner }, {
    $setOnInsert: { owner, input, status: "queued" },
  }, { upsert: true });
}

export async function readGenerationJob(id: string, owner: string) {
  await connectDB();
  // A terminated process cannot finish its job. Keep it recoverable as a visible failure,
  // without automatically repeating a potentially billable generation.
  await Job.updateOne({
    _id: id, owner, status: "running",
    startedAt: { $lt: new Date(Date.now() - 20 * 60 * 1000) },
  }, { $set: { status: "failed", message: "Generation was interrupted. Please try again." } });
  const job = await Job.findOne({ _id: id, owner }).lean();
  if (!job) return null;
  return {
    id: job._id,
    status: job.status,
    input: job.input,
    generated: job.generated,
    message: job.message,
  };
}

export async function runGenerationJob(id: string, owner: string) {
  try {
    await connectDB();
    await executeGenerationJob(id, owner, {
      claim: (jobId, userId) => Job.findOneAndUpdate(
        { _id: jobId, owner: userId, status: "queued" },
        { $set: { status: "running", startedAt: new Date() } },
        { new: true },
      ).lean(),
      async complete(jobId, userId, generated) {
        await Job.updateOne({ _id: jobId, owner: userId, status: "running" }, {
          $set: { status: "completed", generated },
        });
      },
      async fail(jobId, userId, message) {
        await Job.updateOne({ _id: jobId, owner: userId, status: "running" }, {
          $set: { status: "failed", message },
        });
      },
    }, input => new AdminSongGenerationService(createCatalogueContentGenerationService()).generate(input));
  } catch (error) {
    logger.error("Song generation job persistence failed", error, { requestId: id });
  }
}
