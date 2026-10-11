import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fetchSpotifyPlaylistMetadata} from "@/integrations/spotify/spotify-playlist-metadata";
import {createPlaylistActionHandler} from "@/app/admin/playlists/playlist-action-handler";
import {playlistFormInput} from "@/app/admin/playlists/playlist-form.data";
import type {PlaylistService} from "@/modules/playlists/application/playlist.service";
import {DuplicatePlaylistError, PlaylistConflictError} from "@/modules/playlists/application/playlist-write.error";
import type {PlaylistEntity} from "@/modules/playlists/domain/playlist.types";

const playlistId = "37i9dQZF1DXcBWIGoYBM5M";
const recordId = "507f191e810c19729de860ea";
const playlistUrl = `https://open.spotify.com/playlist/${playlistId}?si=abc`;

test("Spotify playlist metadata lookup uses app credentials and imports only available public metadata", async () => {
  const calls: {url: string; options?: RequestInit}[] = [];
  const fetcher = (async (url: string, options?: RequestInit) => {
    calls.push({url, options});
    if (url.endsWith("/api/token")) return Response.json({access_token: "token"});
    return Response.json({
      id: playlistId, name: "  Myanmar Rock  ", description: "Great Burmese music",
      images: [{url: "https://example.com/cover.jpg"}], owner: {display_name: "Curator"},
    });
  }) as typeof fetch;
  const result = await fetchSpotifyPlaylistMetadata(playlistUrl, {clientId: "id", clientSecret: "secret"}, fetcher);
  assert.deepEqual(result, {
    playlistId, url: `https://open.spotify.com/playlist/${playlistId}`, title: "Myanmar Rock",
    description: "Great Burmese music", imageUrl: "https://example.com/cover.jpg", curator: "Curator",
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://accounts.spotify.com/api/token");
  assert.match(String((calls[0].options?.headers as Record<string, string>).Authorization), /^Basic /);
  assert.equal(calls[1].url, `https://api.spotify.com/v1/playlists/${playlistId}`);
  assert.equal((calls[1].options?.headers as Record<string, string>).Authorization, "Bearer token");
});

test("Spotify playlist import rejects unsafe URLs and explains private/unavailable playlists", async () => {
  let called = false;
  const mustNotFetch = (async () => {called = true; throw new Error("fetch should not run");}) as typeof fetch;
  await assert.rejects(() => fetchSpotifyPlaylistMetadata("https://evil.test/playlist/123", {clientId: "id", clientSecret: "secret"}, mustNotFetch), /valid Spotify playlist URL/);
  assert.equal(called, false);
  for (const [status, message] of [[404, /could not find/], [403, /does not permit access/]] as const) {
    const fetcher = (async (url: string) => url.includes("api/token") ? Response.json({access_token: "token"}) : new Response(null, {status})) as typeof fetch;
    await assert.rejects(() => fetchSpotifyPlaylistMetadata(playlistUrl, {clientId: "id", clientSecret: "secret"}, fetcher), message);
  }
});

function validForm(): FormData {
  const form = new FormData();
  form.set("url", playlistUrl);
  form.set("title", "Myanmar Rock");
  form.set("sortOrder", "0");
  form.append("genres", "rock");
  return form;
}

test("admin playlist form produces typed optional fields and selected genres", () => {
  const form = validForm();
  form.set("description", "");
  form.set("curator", "A curator");
  form.append("genres", "pop");
  assert.deepEqual(playlistFormInput(form), {
    platform: "spotify", url: playlistUrl, title: "Myanmar Rock",
    description: undefined, imageUrl: undefined, curator: "A curator",
    genres: ["rock", "pop"], sortOrder: 0,
  });
});

test("playlist create validates inputs before authorization and persists with admin identity", async () => {
  let authorized = 0;
  let created = 0;
  let saved = "";
  const handler = createPlaylistActionHandler({
    authorize: async () => {authorized++; return {userId: "admin-1"};},
    playlists: {
      create: async (input: unknown, userId?: string) => {
        created++;
        assert.equal(userId, "admin-1");
        assert.equal((input as {title: string}).title, "Myanmar Rock");
        return {id: recordId} as PlaylistEntity;
      },
      update: async () => {throw new Error("not called");},
      setStatus: async () => {throw new Error("not called");},
    } as Pick<PlaylistService, "create" | "update" | "setStatus">,
    saved: id => {saved = id; throw new Error("redirect");},
    logFailure: () => {throw new Error("unexpected failure");},
  });

  const bad = validForm(); bad.delete("genres");
  const rejected = await handler.create({}, bad);
  assert.ok(rejected.errors?.genres);
  assert.equal(authorized, 0);
  assert.equal(created, 0);

  await assert.rejects(() => handler.create({}, validForm()), /redirect/);
  assert.equal(authorized, 1);
  assert.equal(created, 1);
  assert.equal(saved, recordId);
});

test("playlist admin handles duplicates, stale revisions, and publication commands safely", async () => {
  const statuses: string[] = [];
  const handler = createPlaylistActionHandler({
    authorize: async () => ({userId: "admin-1"}),
    playlists: {
      create: async () => {throw new DuplicatePlaylistError();},
      update: async () => {throw new PlaylistConflictError();},
      setStatus: async (_id: unknown, _revision: unknown, status: string) => {statuses.push(status); return {id: recordId} as PlaylistEntity;},
    } as Pick<PlaylistService, "create" | "update" | "setStatus">,
    saved: () => {throw new Error("redirect");},
    logFailure: () => {throw new Error("unexpected failure");},
  });
  assert.match((await handler.create({}, validForm())).message ?? "", /already in the directory/);
  assert.match((await handler.update(recordId, 2, {}, validForm())).message ?? "", /changed since/);

  const invalid = new FormData(); invalid.set("status", "unexpected");
  assert.ok((await handler.setStatus(recordId, 2, {}, invalid)).errors?.status);
  assert.deepEqual(statuses, []);

  const publish = new FormData(); publish.set("status", "published");
  await assert.rejects(() => handler.setStatus(recordId, 2, {}, publish), /redirect/);
  assert.deepEqual(statuses, ["published"]);
});

test("playlist admin routes are authenticated and include edit, publication, and Spotify import UX", () => {
  const read = (name: string) => readFileSync(name, "utf8");
  const root = "app/admin/playlists/";
  const list = read(root + "page.tsx");
  const newPage = read(root + "new/page.tsx");
  const edit = read(root + "[id]/edit/page.tsx");
  const form = read(root + "playlist-form.tsx");
  const lookup = read(root + "spotify-playlist-lookup.ts");
  const actions = read(root + "playlist-actions.ts");
  for (const source of [list, newPage, edit, lookup]) assert.match(source, /await requireAdmin\(\)/);
  assert.match(actions, /authorize: requireAdmin/);
  assert.match(form, /<PublicationControls playlist={playlist} \/>/);
  assert.match(form, /lookupSpotifyPlaylistAction/);
  assert.match(form, /name="genres"/);
  assert.match(list, /playlistService.listAdmin\(\)/);
});
