import mongoose, { Model, models, Schema } from "mongoose";
import type { IngestionStatus } from "../domain/ingestion.types";

export interface IIngestion extends mongoose.Document {
  songRequestId: mongoose.Types.ObjectId;
  status: IngestionStatus;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

const IngestionSchema: Schema<IIngestion> = new Schema({
  songRequestId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  status: {
    type: String,
    required: true,
    enum: [
      "awaiting_source",
      "ready_to_generate",
      "generating",
      "needs_admin_input",
      "ready_for_review",
      "approved",
      "rejected",
      "failed",
    ],
    default: "awaiting_source",
  },
  updatedBy: { type: String },
}, { timestamps: true });

const Ingestion: Model<IIngestion> = models.Ingestion || mongoose.model("Ingestion", IngestionSchema);
export default Ingestion;
