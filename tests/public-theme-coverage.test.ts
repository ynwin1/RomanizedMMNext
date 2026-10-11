import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";

function components(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return components(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

test("public components inherit the theme instead of embedding royal palette colours", () => {
  const paths = [...components("app/components"), ...components("app/(pages)")];
  for (const path of paths) {
    // Explicit user-selected preview swatches and external social network brands keep their identity.
    if (path.endsWith("ThemePicker.tsx") || path.endsWith("SocialShare.tsx")) continue;
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /#[0-9a-fA-F]{6}\b/, `Hard-coded colour in ${path}`);
  }
});

test("search, lyrics, discovery and public navigation use semantic theme tokens", () => {
  const search = readFileSync("app/components/searchbar/SearchBar.tsx", "utf8");
  const lyrics = readFileSync("app/components/music-box/LyricsSection.tsx", "utf8");
  const navigation = readFileSync("app/components/navbar/menu/Menu.tsx", "utf8");
  const homepage = readFileSync("app/(pages)/[locale]/(home)/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(search, /backgroundColor: "var\(--surface\)"/);
  assert.match(lyrics, /bg-surface/);
  assert.match(navigation, /bg-background/);
  assert.match(homepage, /bg-background/);
  assert.match(css, /--overlay:/);
  assert.match(css, /::selection \{ background: var\(--accent\)/);
});
