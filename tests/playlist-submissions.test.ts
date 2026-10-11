import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PlaylistSubmissionSchema} from "../modules/playlists/application/playlist-submission";
import {approvePlaylistSuggestion} from "../modules/playlists/application/playlist-submission-review";

test("playlist suggestions accept exact Spotify IDs or public playlist links", () => {
  const id = "1".repeat(22);
  const result = PlaylistSubmissionSchema.parse({playlistId: id, genre: "pop"});
  assert.deepEqual(result, {playlistId: id, url: `https://open.spotify.com/playlist/${id}`, genre: "pop"});
  assert.deepEqual(PlaylistSubmissionSchema.parse({playlistId: result.url, genre: "rock"}).playlistId, id);
  assert.equal(PlaylistSubmissionSchema.safeParse({playlistId: "https://example.com/playlist/foo", genre: "pop"}).success, false);
  assert.equal(PlaylistSubmissionSchema.safeParse({playlistId: id, genre: "wrong-genre"}).success, false);
  assert.equal(PlaylistSubmissionSchema.safeParse({playlistId: id, genre: "pop", status: "published"}).success, false);
});

test("approving a suggestion imports Spotify metadata and publishes after admin review", async () => {
  const calls: string[] = [];
  const id = await approvePlaylistSuggestion({playlistId: "1".repeat(22), url: "https://open.spotify.com/playlist/" + "1".repeat(22), genre: "jazz-blues"}, {
    fetchMetadata: async () => ({title: "Myanmar Jazz", url: "https://open.spotify.com/playlist/" + "1".repeat(22), curator: "Curator"}),
    findExisting: async () => null,
    playlistService: {
      create: async input => { calls.push(JSON.stringify(input)); return {id: "new", revision: 0} as never; },
      setStatus: async (recordId, revision, status) => {calls.push(`${recordId}:${revision}:${status}`); return {} as never;},
      update: async () => ({} as never),
    },
  });
  assert.equal(id, "new");
  assert.match(calls[0], /"genres":\["jazz-blues"\]/);
  assert.equal(calls[1], "new:0:published");
});

test("existing playlists are not inserted a second time", async () => {
  let creations = 0;
  const result = await approvePlaylistSuggestion({playlistId: "1".repeat(22), url: "https://open.spotify.com/playlist/" + "1".repeat(22), genre: "pop"}, {
    fetchMetadata: async () => ({title: "Example", url: "https://open.spotify.com/playlist/" + "1".repeat(22)}),
    findExisting: async () => ({id: "existing", revision: 2, status: "published", genres: ["pop"], platform: "spotify", title: "Example", url: "https://open.spotify.com/playlist/" + "1".repeat(22), sortOrder: 0}),
    playlistService: {create: async () => {creations++; return {} as never;}, setStatus: async () => ({} as never), update: async () => ({} as never)},
  });
  assert.equal(result, "existing");
  assert.equal(creations, 0);
});

test("public submission form, Discord notification, and guarded admin queue are wired", () => {
  const page = readFileSync("app/(pages)/[locale]/(songs)/playlists/page.tsx", "utf8");
  const form = readFileSync("app/components/playlists/PlaylistSubmissionForm.tsx", "utf8");
  const api = readFileSync("app/api/playlist-submissions/route.ts", "utf8");
  const admin = readFileSync("app/admin/playlists/submissions/page.tsx", "utf8");
  const actions = readFileSync("app/admin/playlists/submissions/actions.ts", "utf8");
  assert.match(page, /PlaylistSubmissionForm/);
  assert.match(form, /api\/playlist-submissions/);
  assert.match(api, /sendDiscordNotification/);
  assert.match(admin, /requireAdmin/);
  assert.match(actions, /requireAdmin/);
  assert.match(actions, /revalidatePath\("\/en\/playlists"\)/);
});
