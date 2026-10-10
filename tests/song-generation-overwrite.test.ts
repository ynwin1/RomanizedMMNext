import test from "node:test";
import assert from "node:assert/strict";
import { requiresGenerationOverwriteConfirmation } from "@/app/admin/songs/song-generation-overwrite";

test("empty V2 editor allows the first generation without confirmation", () => {
  assert.equal(requiresGenerationOverwriteConfirmation([]), false);
});

test("existing generated and manually edited lyrics require confirmation before overwriting", () => {
  assert.equal(requiresGenerationOverwriteConfirmation([{ kind: "line", burmese: "မင်း", romanized: "Min", meaning: null }]), true);
  assert.equal(requiresGenerationOverwriteConfirmation([
    { kind: "line", burmese: "ငါ", romanized: "Ngar", meaning: "I" },
    { kind: "break" },
    { kind: "line", burmese: "မင်း", romanized: "Min", meaning: "You" },
  ]), true);
});
