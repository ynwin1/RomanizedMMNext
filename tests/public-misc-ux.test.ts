import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test("song request page accepts submissions while showing queued and added songs", () => {
  const page = read("app/(pages)/[locale]/(songs)/song-request/page.tsx");
  assert.match(page, /translator\("open"\)/);
  assert.match(page, /translator\("openMessage"\)/);
  assert.match(page, /songRequestService\.getQueue\(\)/);
  assert.match(page, /songService\.getLatestSongs\(5\)/);
  assert.match(page, /songRequests\.length \?/);
  assert.match(page, /lastAddedSongs\.length \?/);
  assert.match(page, /href={`\/\$\{locale\}\/song\/\$\{buildSongNameForURL/);
  assert.match(page, /<SongRequestForm\s*\/>/);
  assert.doesNotMatch(page, /translator\("paused"\)|translator\("stopMessage"\)/);
  assert.doesNotMatch(page, /w-\[\d+vw\]/);
});

test("request result and not-found navigation respects active locale", () => {
  const button = read("app/components/buttons/FormReturnButton.tsx");
  const success = read("app/(pages)/[locale]/(songs)/song-request/success/page.tsx");
  const failure = read("app/(pages)/[locale]/(songs)/song-request/error/page.tsx");
  const missing = read("app/(pages)/[locale]/not-found.tsx");
  assert.match(button, /<Link/);
  assert.match(button, /href={`\/\$\{locale\}\$\{url\}`}/);
  assert.match(success, /t\("successTitle"\)/);
  assert.match(failure, /t\("errorTitle"\)/);
  assert.match(missing, /getLocale\(\)/);
  assert.match(missing, /href={`\/\$\{locale\}\/song-catalogue`}/);
  assert.doesNotMatch(missing, /\/en\/song-catalogue/);
});

test("about page and visitor table use the public palette and responsive width", () => {
  const about = read("app/(pages)/[locale]/(songs)/about/page.tsx");
  const stats = read("app/components/country-counter/countryStatsUI.tsx");
  assert.match(about, /<CountryStatsUI \/>/);
  assert.match(about, /bg-surface/);
  assert.match(stats, /w-full overflow-x-auto/);
  assert.match(stats, /countryStats\.length === 0/);
  assert.doesNotMatch(stats, /from-gray-900|w-\[80vw\]/);
});
