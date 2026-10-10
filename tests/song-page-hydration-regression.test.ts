import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("embedded video player loads client-only to avoid ReactPlayer SSR hydration divergence", () => {
  const source = readFileSync(resolve(process.cwd(), "app/components/youtube-player/YoutubePlayer.tsx"), "utf8");
  assert.match(source, /dynamic\(\(\) => import\("react-player"\),\s*\{/);
  assert.match(source, /ssr:\s*false/);
  assert.match(source, /<BrowserReactPlayer/);
});

test("song page has no stray literal backslash-n before the search bar", () => {
  const source = readFileSync(resolve(process.cwd(), "app/(pages)/[locale]/(songs)/song/[name]/[id]/page.tsx"), "utf8");
  assert.doesNotMatch(source, /\\\\n\s*<script type="application\/ld\+json"/);
  assert.match(source, /<script type="application\/ld\+json"/);
  assert.match(source, /<SearchBar \/>/);
});
