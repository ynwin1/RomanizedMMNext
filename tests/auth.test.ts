import test from "node:test";
import assert from "node:assert/strict";

import { isAdminPrincipal } from "@/infrastructure/auth/authorization";

test("admin authorization rejects missing principals", () => {
  assert.equal(isAdminPrincipal(null), false);
});

test("admin authorization rejects authenticated non-admin users", () => {
  assert.equal(isAdminPrincipal({ userId: "user-1", role: null }), false);
});

test("admin authorization accepts admin users", () => {
  assert.equal(isAdminPrincipal({ userId: "admin-1", role: "admin" }), true);
});
