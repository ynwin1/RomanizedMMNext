import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadPlaylistDiscovery} from "@/modules/playlists/application/playlist-discovery";
import {PLAYLIST_GENRES, type PlaylistEntity, type PlaylistGenre} from "@/modules/playlists/domain/playlist.types";
import {generateMetadata} from "@/app/(pages)/[locale]/(songs)/playlists/page";

const row = (genre: PlaylistGenre, i: number): PlaylistEntity => ({
  id: String(i), platform: "spotify", platformPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
  url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M", title: `Playlist ${i}`,
  genres: [genre], status: "published", revision: 0, sortOrder: i,
});

test("playlist discovery lists all curated genres, hides empty groups, and caps overview sections at three", async () => {
  const calls: {genre: string; limit: number}[] = [];
  const {selectedGenre, groups} = await loadPlaylistDiscovery(undefined, async (genre, limit) => {
    calls.push({genre, limit});
    return genre === "rock" ? Array.from({length: 8}, (_, index) => row(genre, index)) : [];
  });
  assert.equal(selectedGenre, null);
  assert.deepEqual(calls.map(call => call.genre), [...PLAYLIST_GENRES]);
  assert.ok(calls.every(call => call.limit === 3));
  assert.equal(groups.length, 1);
  assert.equal(groups[0].genre, "rock");
  assert.equal(groups[0].playlists.length, 3);
});

test("exploring one genre shows up to five playlists", async () => {
  const calls: number[] = [];
  const {groups} = await loadPlaylistDiscovery("jazz-blues", async (genre, limit) => {
    calls.push(limit);
    return Array.from({length: 8}, (_, index) => row(genre, index));
  });
  assert.deepEqual(calls, [5]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].playlists.length, 5);
});

test("genre filters query only one category and malformed filters safely show all", async () => {
  const seen: string[] = [];
  const loader = async (genre: PlaylistGenre) => {seen.push(genre); return [row(genre, 1)];};
  const selected = await loadPlaylistDiscovery("jazz-blues", loader);
  assert.equal(selected.selectedGenre, "jazz-blues");
  assert.deepEqual(seen, ["jazz-blues"]);
  assert.equal(selected.groups.length, 1);
  seen.length = 0;
  const malformed = await loadPlaylistDiscovery(["rock", "pop"], loader);
  assert.equal(malformed.selectedGenre, null);
  assert.equal(seen.length, PLAYLIST_GENRES.length);
});

test("playlist discovery has canonical bilingual metadata", async () => {
  const english = await generateMetadata({params: Promise.resolve({locale: "en"})});
  const burmese = await generateMetadata({params: Promise.resolve({locale: "my"})});
  assert.equal(english.alternates?.canonical, "https://www.romanizedmm.com/en/playlists");
  assert.equal(burmese.alternates?.canonical, "https://www.romanizedmm.com/my/playlists");
  assert.deepEqual(english.alternates?.languages, {
    en: "https://www.romanizedmm.com/en/playlists",
    my: "https://www.romanizedmm.com/my/playlists",
  });
});

test("playlist cards use semantic themes, safe external links, and defer third-party embeds", () => {
  const read = (path: string) => readFileSync(path, "utf8");
  const card = read("app/components/playlists/PlaylistCard.tsx");
  const preview = read("app/components/playlists/PlaylistPreview.tsx");
  const page = read("app/(pages)/[locale]/(songs)/playlists/page.tsx");
  const admin = read("app/admin/playlists/playlist-actions.ts");
  assert.match(card, /bg-surface/);
  assert.match(card, /rel="noopener noreferrer"/);
  assert.match(card, /playlist\.platform === "spotify"/);
  assert.match(preview, /\{open && <div/);
  assert.match(preview, /open\.spotify\.com\/embed\/playlist/);
  assert.match(preview, /loading="lazy"/);
  assert.match(preview, /aria-expanded={open}/);
  assert.match(page, /loadPlaylistDiscovery/);
  assert.match(page, /aria-current={selectedGenre === genre \? "page" : undefined}/);
  assert.match(admin, /revalidatePath\("\/en\/playlists"\)/);
  assert.match(admin, /revalidatePath\("\/my\/playlists"\)/);
});
