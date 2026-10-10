import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("desktop navigation exposes primary destinations and mobile menu is accessible", () => {
  const menu = readFileSync("app/components/navbar/menu/Menu.tsx", "utf8");
  assert.match(menu, /lg:flex/);
  assert.match(menu, /aria-expanded={isOpen}/);
  assert.match(menu, /aria-modal="true"/);
  assert.match(menu, /event.key === "Escape"/);
  assert.match(menu, /previousOverflow/);
  assert.match(menu, /translator\("songRequest"\)/);
});

test("search remains visible before hydration, supports feedback and encoded input", () => {
  const search = readFileSync("app/components/searchbar/SearchBar.tsx", "utf8");
  assert.match(search, /type="search" disabled/);
  assert.match(search, /encodeURIComponent\(input.trim\(\)\)/);
  assert.match(search, /loadingMessage/);
  assert.match(search, /No matching songs found/);
  assert.match(search, /router.push/);
});

test("language control is compact and highlights navigation instead of dominating it", () => {
  const selector = readFileSync("app/components/language-switch/LanguageSwitcher.tsx", "utf8");
  assert.match(selector, /<select/);
  assert.match(selector, /aria-label="Site language"/);
  assert.match(selector, /<option value="en">EN<\/option>/);
  assert.match(selector, /<option value="my">မြန်မာ<\/option>/);
  assert.doesNotMatch(selector, /px-5 py-2\.5 text-lg/);
});
