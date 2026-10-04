import { z } from "zod";

export const IngestionIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ingestion id");
export const IngestionRequestIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid request id");
export const IngestionRevisionSchema = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

export const IngestionStatusSchema = z.enum([
  "awaiting_source",
  "ready_to_generate",
  "generating",
  "needs_admin_input",
  "ready_for_review",
  "approved",
  "rejected",
  "failed",
]);

export const CreateIngestionSchema = z.object({
  songRequestId: IngestionRequestIdSchema,
}).strict();

export const TransitionIngestionCommandSchema = z.object({
  id: IngestionIdSchema,
  revision: IngestionRevisionSchema,
  nextStatus: IngestionStatusSchema,
}).strict();

export const SaveIngestionSourceSchema = z.object({
  ingestionId: IngestionIdSchema,
  ingestionRevision: IngestionRevisionSchema,
  draftRevision: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  burmeseLyrics: z.string().max(200000).refine(value => value.trim().length > 0, "Burmese lyrics are required"),
}).strict();

export type CreateIngestionInput = z.infer<typeof CreateIngestionSchema>;
export type TransitionIngestionCommand = z.infer<typeof TransitionIngestionCommandSchema>;
export type SaveIngestionSourceCommand = z.infer<typeof SaveIngestionSourceSchema>;
