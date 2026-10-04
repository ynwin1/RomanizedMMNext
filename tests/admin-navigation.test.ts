import test from "node:test";
import assert from "node:assert/strict";
import { adminNavigation, isAdminRouteActive } from "@/app/admin/admin-navigation";

test("overview is active only at the admin root", () => {
  assert.equal(isAdminRouteActive("/admin", "/admin"), true);
  assert.equal(isAdminRouteActive("/admin/", "/admin"), true);
  assert.equal(isAdminRouteActive("/admin/songs", "/admin"), false);
});

test("sections remain active for nested management routes", () => {
  for (const href of ["/admin/songs", "/admin/artists", "/admin/requests", "/admin/migrations/lyrics-v2"]) {
    assert.equal(isAdminRouteActive(href, href), true);
    assert.equal(isAdminRouteActive(href + "/123/edit", href), true);
    assert.equal(isAdminRouteActive(href + "/", href), true);
  }
});

test("similar prefixes and unrelated routes do not activate a section", () => {
  assert.equal(isAdminRouteActive("/admin/songs-old", "/admin/songs"), false);
  assert.equal(isAdminRouteActive("/admin/artists", "/admin/songs"), false);
  assert.equal(isAdminRouteActive("/en/song-catalogue", "/admin/songs"), false);
});

test("each supported admin location activates exactly one navigation item", () => {
  for (const { href } of adminNavigation) {
    assert.deepEqual(adminNavigation.filter(item => isAdminRouteActive(href, item.href)).map(item => item.href), [href]);
  }
});
