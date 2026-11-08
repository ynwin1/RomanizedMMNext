import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("cover moderation UI provides editable fields and approve/reject controls", () => {
  // This client component uses Next's app router; assert its review contract
  // without attempting to mount useRouter outside the Next app context.
  const source = readFileSync("app/admin/cover-submissions/CoverReviewControls.tsx", "utf8");
  assert.match(source, /Video title \(optional\)/);
  assert.match(source, /Description \(optional\)/);
  assert.match(source, /Approve & publish/);
  assert.match(source, /Reject/);
  assert.match(source, /reviewSongCoverAdminAction/);
});

test("cover queue is protected and links to source song editor", () => {
  const source = readFileSync("app/admin/cover-submissions/page.tsx", "utf8");
  assert.match(source, /await requireAdmin\(\)/);
  assert.match(source, /songCoverService\.adminQueue/);
  assert.match(source, /cover-submissions/);
  assert.match(source, /\/edit#covers/);
});
