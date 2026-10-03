import test from "node:test";
import assert from "node:assert/strict";

import { isAdminPrincipal } from "@/infrastructure/auth/authorization";
import { createRequireAdmin } from "@/infrastructure/auth/require-admin";

test("admin authorization rejects missing principals", () => {
  assert.equal(isAdminPrincipal(null), false);
});

test("admin authorization rejects authenticated non-admin users", () => {
  assert.equal(isAdminPrincipal({ userId: "user-1", role: null }), false);
});

test("admin authorization accepts admin users", () => {
  assert.equal(isAdminPrincipal({ userId: "admin-1", role: "admin" }), true);
});

test("anonymous admin access redirects through sign-in before any admin page can continue", async () => {
  const calls: string[] = [];
  const denied = new Error("redirect");
  const requireAdmin = createRequireAdmin({
    getPrincipal: async () => null,
    redirectToSignIn: async () => { calls.push("sign-in"); },
    redirect: path => { calls.push("redirect:" + path); throw denied; },
  });

  await assert.rejects(() => requireAdmin(), error => error === denied);
  assert.deepEqual(calls, ["sign-in", "redirect:/"]);
});

test("authenticated non-admin access is rejected without invoking sign-in", async () => {
  const calls: string[] = [];
  const denied = new Error("redirect");
  const requireAdmin = createRequireAdmin({
    getPrincipal: async () => ({ userId: "user-1", role: null }),
    redirectToSignIn: async () => { calls.push("sign-in"); },
    redirect: path => { calls.push("redirect:" + path); throw denied; },
  });

  await assert.rejects(() => requireAdmin(), error => error === denied);
  assert.deepEqual(calls, ["redirect:/"]);
});

test("admin access returns the authenticated principal", async () => {
  const requireAdmin = createRequireAdmin({
    getPrincipal: async () => ({ userId: "admin-1", role: "admin" }),
    redirectToSignIn: async () => { throw new Error("unexpected sign-in"); },
    redirect: () => { throw new Error("unexpected redirect"); },
  });

  assert.deepEqual(await requireAdmin(), { userId: "admin-1", role: "admin" });
});
