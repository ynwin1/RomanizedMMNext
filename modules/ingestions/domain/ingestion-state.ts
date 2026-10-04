import type { IngestionStatus } from "./ingestion.types";

const transitions: Record<IngestionStatus, readonly IngestionStatus[]> = {
  awaiting_source: ["ready_to_generate"],
  ready_to_generate: ["generating"],
  generating: ["needs_admin_input", "failed"],
  needs_admin_input: ["ready_for_review"],
  ready_for_review: ["generating", "approved", "rejected"],
  failed: ["generating"],
  approved: [],
  rejected: [],
};

export function canTransitionIngestion(from: IngestionStatus, to: IngestionStatus): boolean {
  return transitions[from].includes(to);
}

export function allowedIngestionTransitions(from: IngestionStatus): readonly IngestionStatus[] {
  return transitions[from];
}
