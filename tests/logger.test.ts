import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeLogString } from "@/infrastructure/logging/logger";

test("logger sanitization redacts Mongo connection strings", () => {
  assert.equal(
    sanitizeLogString("connect failed mongodb+srv://user:pass@cluster.example/db?retryWrites=true"),
    "connect failed [REDACTED_DATABASE_URL]",
  );
  assert.equal(
    sanitizeLogString("mongodb://secret-host/internal"),
    "[REDACTED_DATABASE_URL]",
  );
});

test("logger sanitization redacts common secret query values and bearer tokens", () => {
  assert.equal(
    sanitizeLogString("https://example.com/callback?token=abc123&next=/home"),
    "https://example.com/callback?token=[REDACTED]&next=/home",
  );
  assert.equal(
    sanitizeLogString("Authorization: Bearer abc.def.ghi"),
    "Authorization: Bearer [REDACTED]",
  );
});

test("logger sanitization preserves ordinary diagnostic text", () => {
  assert.equal(
    sanitizeLogString("Song request persistence failed for request 17"),
    "Song request persistence failed for request 17",
  );
});
