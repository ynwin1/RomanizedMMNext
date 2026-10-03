import test from "node:test";
import assert from "node:assert/strict";
import { AdminListQuerySchema, adminPage } from "@/shared/admin-list";
import { literalSearch } from "@/shared/literal-search";
import { AdminRequestQuerySchema } from "@/modules/requests/application/song-request.admin-query";
import { requestAdminFilter } from "@/modules/requests/infrastructure/song-request.admin-filter";
import { AdminReadService } from "@/modules/admin";
import { parseAdminSearchParams, adminPageHref } from "@/app/admin/admin-query";

test("admin queries default, trim, and reject unsafe pagination or oversized search", () => {
  assert.deepEqual(AdminListQuerySchema.parse({}), { page: 1, limit: 20, q: "" });
  assert.deepEqual(AdminListQuerySchema.parse({ page: "2", limit: "5", q: "  မြန်မာ  " }), { page: 2, limit: 5, q: "မြန်မာ" });
  for (const page of [0, -1, 1.5, Infinity, "bad", 100001])
    assert.equal(AdminListQuerySchema.safeParse({ page }).success, false);
  for (const limit of [0, -1, 101, 1.5])
    assert.equal(AdminListQuerySchema.safeParse({ limit }).success, false);
  assert.equal(AdminListQuerySchema.safeParse({ q: "a".repeat(101) }).success, false);
  assert.equal(AdminRequestQuerySchema.safeParse({ status: "reviewing" }).success, false);
  assert.equal(AdminRequestQuerySchema.parse({ status: "added" }).status, "added");
});

test("search metacharacters are literal and matching is case insensitive", () => {
  const text = "A.*+[test](x)?^$|\\";
  const regex = literalSearch(text);
  assert.equal(regex.test(text.toLowerCase()), true);
  assert.equal(regex.test("Anything"), false);
  assert.equal(literalSearch("မြန်မာ").test("မြန်မာ သီချင်း"), true);
});

test("pending request filters include legacy missing/null statuses and combine search", () => {
  const pending = requestAdminFilter("", "pending");
  assert.deepEqual(pending, { $and: [{ $or: [{ status: "pending" }, { status: { $exists: false } }, { status: null }] }] });
  assert.deepEqual(requestAdminFilter("", "added"), { $and: [{ status: "added" }] });
  assert.deepEqual(requestAdminFilter(""), {});
  const combined = requestAdminFilter("Song.*", "pending");
  assert.equal(combined.$and?.length, 2);
  const regex = combined.$and?.[0].$or?.[0].songName as RegExp;
  assert.equal(regex.test("Song.*"), true);
  assert.equal(regex.test("Song anything"), false);
});

test("pagination handles empty lists, partial last pages, and out-of-range pages", () => {
  assert.equal(adminPage([], 0, { page: 1, limit: 20, q: "" }).totalPages, 0);
  assert.deepEqual(adminPage(["last"], 21, { page: 2, limit: 20, q: "" }), { items: ["last"], total: 21, page: 2, limit: 20, totalPages: 2 });
  assert.equal(adminPage([], 21, { page: 9, limit: 20, q: "" }).page, 9);
});

test("URL parsing tolerates invalid/duplicate parameters and preserves encoded filters in links", () => {
  assert.deepEqual(parseAdminSearchParams({ page: "bad", q: ["  Burmese & jazz ", "ignored"], status: "reviewing" }), { page: 1, limit: 20, q: "Burmese & jazz" });
  assert.equal(parseAdminSearchParams({ page: "-4" }).page, 1);
  assert.equal(parseAdminSearchParams({ q: "x".repeat(200) }).q.length, 100);
  const url = new URL(adminPageHref("/admin/requests", { q: "မြန်မာ & +", status: "pending" }, 2), "https://example.com");
  assert.equal(url.searchParams.get("q"), "မြန်မာ & +");
  assert.equal(url.searchParams.get("status"), "pending");
  assert.equal(url.searchParams.get("page"), "2");
});

function reads(authorize: () => Promise<unknown>, calls: string[]) {
  const page = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  return new AdminReadService(authorize, {
    getAdminCount: async () => { calls.push("songs"); return 12; },
    getAdminList: async input => { calls.push("recent:" + JSON.stringify(input)); return page; },
  }, {
    getAdminCount: async () => { calls.push("artists"); return 4; },
    getAdminList: async () => { calls.push("artist-list"); return page; },
  }, {
    getAdminCount: async status => { calls.push(status ?? "requests"); return status ? 3 : 9; },
    getAdminList: async () => { calls.push("request-list"); return page; },
  });
}

test("dashboard authorizes before reads and aggregates independent counts and recent songs", async () => {
  const calls: string[] = [];
  const service = reads(async () => { calls.push("auth"); }, calls);
  assert.deepEqual(await service.dashboard(), { songs: 12, artists: 4, requests: 9, pendingRequests: 3, recentSongs: [] });
  assert.equal(calls[0], "auth");
  assert.ok(calls.includes("pending"));
  assert.ok(calls.includes('recent:{"page":1,"limit":5}'));
});

test("every admin read denies access before any content service call", async () => {
  for (const action of ["dashboard", "listSongs", "listArtists", "listRequests"] as const) {
    const calls: string[] = [];
    const service = reads(async () => { throw new Error("denied"); }, calls);
    await assert.rejects(() => action === "dashboard" ? service.dashboard() : service[action]({}), /denied/);
    assert.deepEqual(calls, []);
  }
});

test("dashboard read failures propagate to the error boundary rather than becoming zero totals", async () => {
  const calls: string[] = [];
  const service = new AdminReadService(async () => {}, {
    getAdminCount: async () => { throw new Error("database unavailable"); },
    getAdminList: async () => adminPage([], 0, { page: 1, limit: 5, q: "" }),
  }, { getAdminCount: async () => 0, getAdminList: async () => adminPage([], 0, { page: 1, limit: 20, q: "" }) },
  { getAdminCount: async () => 0, getAdminList: async () => adminPage([], 0, { page: 1, limit: 20, q: "" }) });
  await assert.rejects(() => service.dashboard(), /database unavailable/);
  assert.deepEqual(calls, []);
});
