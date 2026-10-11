import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test("shared navigation preserves locale and traps mobile dialog keyboard focus", () => {
  const navbar = read("app/components/navbar/Navbar.tsx");
  const menu = read("app/components/navbar/menu/Menu.tsx");
  assert.match(navbar, /const locale = await getLocale\(\)/);
  assert.match(navbar, /href={`\/\$\{locale\}`}/);
  assert.match(menu, /event.key === "Tab"/);
  assert.match(menu, /event\.shiftKey/);
  assert.match(menu, /first\.focus\(\)/);
  assert.match(menu, /last\.focus\(\)/);
  assert.match(menu, /aria-current={pathname ===/);
  assert.match(menu, /translator\("home"\)/);
});

test("theme menu returns focus to its trigger after selection or escape", () => {
  const picker = read("app/components/theme/ThemePicker.tsx");
  assert.match(picker, /ref={trigger}/);
  assert.match(picker, /trigger\.current\?\.focus\(\)/);
  assert.match(picker, /localStorage\.setItem\(STORAGE_KEY, theme\)/);
});

test("footer links have accessible names, safe new tabs, and touch-sized controls", () => {
  const footer = read("app/components/footer/Footer.tsx");
  assert.match(footer, /aria-label="RomanizedMM on Facebook/);
  assert.match(footer, /aria-label="RomanizedMM on GitHub/);
  assert.match(footer, /rel="noopener noreferrer"/);
  assert.match(footer, /min-h-11 min-w-11/);
});

test("public copy and request attribution fit current site status and small screens", () => {
  const home = read("app/(pages)/[locale]/(home)/page.tsx");
  const requester = read("app/components/music-box/RequestedByBox.tsx");
  assert.match(home, /New requests are temporarily paused/);
  assert.match(home, /View request status/);
  assert.match(requester, /w-full max-w-lg/);
  assert.doesNotMatch(requester, /w-\[60%\]|w-\[80%\]/);
});

test("recently added songs use one column on mobile and two on desktop", () => {
  const home = read("app/(pages)/[locale]/(home)/page.tsx");
  assert.match(home, /grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2/);
  assert.match(home, /recentSongs\.map\(song =>/);
  assert.doesNotMatch(home, /lg:grid-cols-6/);
});
