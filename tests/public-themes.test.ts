import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css = readFileSync("app/globals.css", "utf8");
const layout = readFileSync("app/(pages)/[locale]/layout.tsx", "utf8");
const picker = readFileSync("app/components/theme/ThemePicker.tsx", "utf8");
const navbar = readFileSync("app/components/navbar/Navbar.tsx", "utf8");
const adminLayout = readFileSync("app/admin/layout.tsx", "utf8");

test("four public colour themes define shared semantic palette values", () => {
  for (const name of ["midnight-luxury", "cosmic", "vintage-vinyl"]) {
    assert.ok(css.includes(`:root[data-theme="${name}"]`));
  }
  for (const token of ["background", "foreground", "surface", "surface-raised", "muted", "accent", "focus-ring", "border", "border-subtle"]) {
    assert.match(css, new RegExp(`--${token}:`, "g"));
  }
  assert.match(css, /--background: #171613/);
});

test("theme preference is applied before the public page renders", () => {
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(layout, /RomanizedMM_theme/);
  assert.match(layout, /document.documentElement.dataset.theme=theme/);
  assert.doesNotMatch(adminLayout, /ThemePicker|RomanizedMM_theme/);
});

test("accessible theme picker persists all four choices and is in the public navigation", () => {
  for (const name of ["royal-heritage", "midnight-luxury", "cosmic", "vintage-vinyl"]) {
    assert.ok(picker.includes(`id: "${name}"`));
  }
  assert.match(picker, /aria-expanded={open}/);
  assert.match(picker, /aria-pressed={selected === theme.id}/);
  assert.match(picker, /event.key === "Escape"/);
  assert.match(picker, /localStorage.setItem\(STORAGE_KEY, theme\)/);
  assert.match(navbar, /<ThemePicker \/>/);
});
