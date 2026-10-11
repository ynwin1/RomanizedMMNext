import assert from "node:assert/strict";
import test from "node:test";
import { fetchSpotifyTrackMetadata, parseSpotifyTrackId } from "../integrations/spotify/spotify-metadata";

const id = "11dFghVXANMlKmJXsNCbNl";

test("accepts Spotify IDs, track URLs and URIs only", () => {
  assert.equal(parseSpotifyTrackId(id), id);
  assert.equal(parseSpotifyTrackId(`spotify:track:${id}`), id);
  assert.equal(parseSpotifyTrackId(`https://open.spotify.com/track/${id}?si=abc`), id);
  assert.equal(parseSpotifyTrackId(`https://open.spotify.com/intl-en/track/${id}`), id);
  assert.equal(parseSpotifyTrackId(`https://open.spotify.com/artist/${id}`), null);
  assert.equal(parseSpotifyTrackId(`https://evil.example/track/${id}`), null);
  assert.equal(parseSpotifyTrackId("bad-id"), null);
});

test("retrieves track metadata and deduplicates artist genres", async () => {
  const visited: string[] = [];
  const mockFetch = (async (url: string) => {
    visited.push(url);
    if (url.includes("/api/token")) return Response.json({ access_token: "test-token" });
    if (url.includes("/tracks/")) return Response.json({
      id, name: "Test Song", artists: [{ id: "a", name: "Artist A" }, { id: "b", name: "Artist B" }],
      album: { name: "Test Album", images: [{ url: "https://example.org/cover.jpg" }], release_date: "2026-01-01" },
      external_urls: { spotify: `https://open.spotify.com/track/${id}` },
      duration_ms: 240000, external_ids: { isrc: "ABC123" },
    });
    return Response.json({ genres: ["Myanmar pop", "pop"] });
  }) as typeof fetch;
  const track = await fetchSpotifyTrackMetadata(id, { clientId: "id", clientSecret: "secret" }, mockFetch);
  assert.equal(track.name, "Test Song");
  assert.equal(track.artists.length, 2);
  assert.deepEqual(track.genres, ["Myanmar pop", "pop"]);
  assert.equal(track.isrc, "ABC123");
  assert.equal(visited.length, 4);
});

test("handles invalid IDs without calling Spotify", async () => {
  await assert.rejects(fetchSpotifyTrackMetadata("invalid", { clientId: "id", clientSecret: "secret" }, (() => {
    throw new Error("must not fetch");
  }) as typeof fetch), /valid Spotify track/);
});
