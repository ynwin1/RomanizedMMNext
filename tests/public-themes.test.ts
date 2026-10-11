import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const css = readFileSync("app/globals.css", "utf8");
const layout = readFileSync("app/(pages)/[locale]/layout.tsx", "utf8");
const picker = readFileSync("app/components/theme/ThemePicker.tsx", "utf8");
const navbar = readFileSync("app/components/navbar/Navbar.tsx", "utf8");
const adminLayout = readFileSync("app/admin/layout.tsx", "utf8");
const themeInit = readFileSync("public/theme-init.js", "utf8");

test("four public colour themes define shared semantic palette values", () => {
  for (const name of ["midnight-luxury", "cosmic", "monsoon-mist"]) {
    assert.ok(css.includes(`:root[data-theme="${name}"]`));
  }
  for (const token of ["background", "foreground", "surface", "surface-raised", "muted", "accent", "focus-ring", "border", "border-subtle"]) {
    assert.match(css, new RegExp(`--${token}:`, "g"));
  }
  assert.match(css, /--background: #171613/);
  assert.match(css, /:root\[data-theme="monsoon-mist"\] \{[\s\S]*?--background: #F6F5ED/);
  assert.match(css, /:root\[data-theme="monsoon-mist"\] \{[\s\S]*?--on-accent: #FFFFFF/);
  assert.doesNotMatch(css, /data-theme="vintage-vinyl"/);
});

test("theme preference is applied before the public page renders", () => {
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(layout, /src="\/theme-init.js" strategy="beforeInteractive"/);
  assert.match(themeInit, /RomanizedMM_theme/);
  assert.match(themeInit, /document.documentElement.dataset.theme = theme/);
  assert.match(themeInit, /theme === "vintage-vinyl"/);
  assert.match(themeInit, /localStorage.setItem\("RomanizedMM_theme", theme\)/);
  assert.doesNotMatch(layout, /dangerouslySetInnerHTML/);
  assert.match(layout, /adsbygoogle.js\?client=[\s\S]*strategy="afterInteractive"/);
  assert.doesNotMatch(adminLayout, /ThemePicker|RomanizedMM_theme/);
});

test("accessible theme picker persists all four choices and is in the public navigation", () => {
  for (const name of ["royal-heritage", "midnight-luxury", "cosmic", "monsoon-mist"]) {
    assert.ok(picker.includes(`id: "${name}"`));
  }
  for (const name of ["Bagan Legacy", "Midnight Mandalay", "Yangon Afterglow", "Taunggyi Mist"]) {
    assert.ok(picker.includes(`name: "${name}"`));
  }
  assert.match(picker, /aria-expanded={open}/);
  assert.match(picker, /aria-pressed={selected === theme.id}/);
  assert.match(picker, /event.key === "Escape"/);
  assert.match(picker, /localStorage.setItem\(STORAGE_KEY, theme\)/);
  assert.match(navbar, /<ThemePicker \/>/);
});

test("existing Vintage Vinyl preferences migrate to Monsoon Mist before rendering", () => {
  const stored = new Map([["RomanizedMM_theme", "vintage-vinyl"]]);
  const document = {documentElement: {dataset: {} as {theme?: string}}};
  const localStorage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
  };
  runInNewContext(themeInit, {document, localStorage});
  assert.equal(document.documentElement.dataset.theme, "monsoon-mist");
  assert.equal(stored.get("RomanizedMM_theme"), "monsoon-mist");
});
