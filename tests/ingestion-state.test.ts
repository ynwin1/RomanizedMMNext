import test from "node:test";
import assert from "node:assert/strict";
import { allowedIngestionTransitions, canTransitionIngestion } from "@/modules/ingestions/domain/ingestion-state";

test("ingestion state machine exposes legal generation, partial-completion, and recovery transitions", () => {
  assert.deepEqual(allowedIngestionTransitions("awaiting_source"), ["ready_to_generate"]);
  assert.deepEqual(allowedIngestionTransitions("ready_to_generate"), ["generating"]);
  assert.deepEqual(allowedIngestionTransitions("generating"), ["ready_to_generate", "ready_for_review", "failed"]);
  assert.deepEqual(allowedIngestionTransitions("needs_admin_input"), ["ready_for_review"]);
  assert.deepEqual(allowedIngestionTransitions("ready_for_review"), ["generating", "approved", "rejected"]);
  assert.deepEqual(allowedIngestionTransitions("failed"), ["generating"]);
});

test("approved and rejected ingestions are terminal", () => {
  assert.deepEqual(allowedIngestionTransitions("approved"), []);
  assert.deepEqual(allowedIngestionTransitions("rejected"), []);
  assert.equal(canTransitionIngestion("approved", "generating"), false);
  assert.equal(canTransitionIngestion("rejected", "ready_for_review"), false);
});

test("state machine rejects skips and invalid backward transitions", () => {
  assert.equal(canTransitionIngestion("awaiting_source", "approved"), false);
  assert.equal(canTransitionIngestion("ready_to_generate", "ready_for_review"), false);
  assert.equal(canTransitionIngestion("needs_admin_input", "awaiting_source"), false);
  assert.equal(canTransitionIngestion("failed", "approved"), false);
});
