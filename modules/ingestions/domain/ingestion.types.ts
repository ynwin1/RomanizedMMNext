export type IngestionStatus =
  | "awaiting_source"
  | "ready_to_generate"
  | "generating"
  | "needs_admin_input"
  | "ready_for_review"
  | "approved"
  | "rejected"
  | "failed";

export interface IngestionEntity {
  id: string;
  songRequestId: string;
  status: IngestionStatus;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface IngestionRecord extends IngestionEntity {
  revision: number;
}
