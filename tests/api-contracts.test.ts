import test from "node:test";
import assert from "node:assert/strict";

import { songService } from "@/modules/songs";
import { artistService } from "@/modules/artists";
import { songRequestService } from "@/modules/requests";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { analyticsService } from "@/modules/analytics";

import { GET as searchGET } from "@/app/api/song/search/route";
import { GET as randomGET } from "@/app/api/song/random/route";
import { GET as artistGET } from "@/app/api/artist/[slug]/route";
import { POST as requestPOST } from "@/app/api/song-request/route";
import { POST as trackCountryPOST } from "@/app/api/track-country/route";

test("search API returns 400 when query is missing", async () => {
  const response = await searchGET(new Request("https://example.com/api/song/search"));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "No query provided" });
});

test("search API preserves its success response contract", async (t) => {
  const songs = [{ songName: "Hello", mmid: 7, artistName: [{ name: "Singer" }] }];
  t.mock.method(songService, "search", async () => songs);

  const response = await searchGET(new Request("https://example.com/api/song/search?query=hello"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, songs });
});

test("random song API returns 404 when catalogue is empty", async (t) => {
  t.mock.method(songService, "getRandomSong", async () => null);

  const response = await randomGET();
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "No songs found" });
});

test("random song API preserves its success response contract", async (t) => {
  const song = { songName: "Random", mmid: 88 };
  t.mock.method(songService, "getRandomSong", async () => song);

  const response = await randomGET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: song });
});

test("artist API removes internal id from its public response", async (t) => {
  const artist = {
    id: "mongo-id",
    name: "Artist",
    slug: "artist",
    imageLink: "https://example.com/a.jpg",
    type: "solo",
    musicGenre: ["Pop"],
    songs: [1],
    likes: 0,
  };
  t.mock.method(artistService, "getBySlug", async () => artist);

  const response = await artistGET(
    new Request("https://example.com/api/artist/artist"),
    { params: Promise.resolve({ slug: "artist" }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.id, undefined);
  assert.equal(body.slug, "artist");
  assert.equal(body.name, "Artist");
});

test("artist API returns 404 for missing artist", async (t) => {
  t.mock.method(artistService, "getBySlug", async () => {
    throw new NotFoundError("missing", "ARTIST_NOT_FOUND");
  });

  const response = await artistGET(
    new Request("https://example.com/api/artist/missing"),
    { params: Promise.resolve({ slug: "missing" }) },
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Artist not found" });
});

test("request API succeeds when Discord webhook is not configured after persistence", async (t) => {
  const previous = process.env.DISCORD_SONG_REQ_WEBHOOK;
  delete process.env.DISCORD_SONG_REQ_WEBHOOK;

  const created = {
    id: "request-id",
    songName: "Song",
    artist: "Artist",
    status: "pending" as const,
  };

  t.mock.method(songRequestService, "create", async () => created);

  try {
    const response = await requestPOST(new Request("https://example.com/api/song-request", {
      method: "POST",
      body: JSON.stringify({ songName: "Song", artist: "Artist" }),
      headers: { "Content-Type": "application/json" },
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      songRequest: {
        _id: "request-id",
        songName: "Song",
        artist: "Artist",
        status: "pending",
      },
    });
  } finally {
    if (previous === undefined) {
      delete process.env.DISCORD_SONG_REQ_WEBHOOK;
    } else {
      process.env.DISCORD_SONG_REQ_WEBHOOK = previous;
    }
  }
});

test("request submission API preserves create + Discord success contract", async (t) => {
  const previous = process.env.DISCORD_SONG_REQ_WEBHOOK;
  process.env.DISCORD_SONG_REQ_WEBHOOK = "https://discord.example/webhook";

  const created = {
    id: "request-id",
    songName: "Song",
    artist: "Artist",
    youtubeLink: "https://youtube.example/watch",
    details: "Please add",
    status: "pending" as const,
  };

  t.mock.method(songRequestService, "create", async () => created);
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 204 }));

  try {
    const response = await requestPOST(new Request("https://example.com/api/song-request", {
      method: "POST",
      body: JSON.stringify({
        songName: "Song",
        artist: "Artist",
        youtubeLink: "https://youtube.example/watch",
        details: "Please add",
      }),
      headers: { "Content-Type": "application/json" },
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      songRequest: {
        _id: "request-id",
        songName: "Song",
        artist: "Artist",
        youtubeLink: "https://youtube.example/watch",
        details: "Please add",
        status: "pending",
      },
    });
  } finally {
    if (previous === undefined) {
      delete process.env.DISCORD_SONG_REQ_WEBHOOK;
    } else {
      process.env.DISCORD_SONG_REQ_WEBHOOK = previous;
    }
  }
});


test("track-country API rejects missing or unknown country", async () => {
  const response = await trackCountryPOST(new Request("https://example.com/api/track-country", {
    method: "POST",
    body: JSON.stringify({ country: "Unknown", country_code: "XX" }),
    headers: { "Content-Type": "application/json" },
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid country name" });
});

test("track-country API preserves its success response contract", async (t) => {
  t.mock.method(analyticsService, "trackCountry", async () => ({
    id: "mongo-id",
    country: "Canada",
    code: "CA",
    count: 9,
  }));

  const response = await trackCountryPOST(new Request("https://example.com/api/track-country", {
    method: "POST",
    body: JSON.stringify({ country: "Canada", country_code: "CA" }),
    headers: { "Content-Type": "application/json" },
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    countryStat: {
      _id: "mongo-id",
      country: "Canada",
      code: "CA",
      count: 9,
    },
  });
});

test("track-country API returns 500 when repository returns no stat", async (t) => {
  t.mock.method(analyticsService, "trackCountry", async () => null);

  const response = await trackCountryPOST(new Request("https://example.com/api/track-country", {
    method: "POST",
    body: JSON.stringify({ country: "Canada", country_code: "CA" }),
    headers: { "Content-Type": "application/json" },
  }));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Failed to create country stat with db error",
  });
});

test("track-country API keeps the existing failure response shape on service errors", async (t) => {
  t.mock.method(analyticsService, "trackCountry", async () => {
    throw new Error("database unavailable");
  });

  const response = await trackCountryPOST(new Request("https://example.com/api/track-country", {
    method: "POST",
    body: JSON.stringify({ country: "Canada", country_code: "CA" }),
    headers: { "Content-Type": "application/json" },
  }));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Failed to create country stat with error - Error: database unavailable",
  });
});


test("request API succeeds when Discord notification fails after persistence", async (t) => {
  const previous = process.env.DISCORD_SONG_REQ_WEBHOOK;
  process.env.DISCORD_SONG_REQ_WEBHOOK = "https://discord.example/webhook";

  const created = {
    id: "request-id",
    songName: "Song",
    artist: "Artist",
    status: "pending" as const,
  };

  t.mock.method(songRequestService, "create", async () => created);
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));

  try {
    const response = await requestPOST(new Request("https://example.com/api/song-request", {
      method: "POST",
      body: JSON.stringify({ songName: "Song", artist: "Artist" }),
      headers: { "Content-Type": "application/json" },
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      songRequest: {
        _id: "request-id",
        songName: "Song",
        artist: "Artist",
        status: "pending",
      },
    });
  } finally {
    if (previous === undefined) {
      delete process.env.DISCORD_SONG_REQ_WEBHOOK;
    } else {
      process.env.DISCORD_SONG_REQ_WEBHOOK = previous;
    }
  }
});


test("request API returns 500 when persistence fails", async (t) => {
  const previous = process.env.DISCORD_SONG_REQ_WEBHOOK;
  delete process.env.DISCORD_SONG_REQ_WEBHOOK;

  t.mock.method(songRequestService, "create", async () => {
    throw new Error("database unavailable");
  });

  try {
    const response = await requestPOST(new Request("https://example.com/api/song-request", {
      method: "POST",
      body: JSON.stringify({ songName: "Song", artist: "Artist" }),
      headers: { "Content-Type": "application/json" },
    }));

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: "Failed to create song request with error - Error: database unavailable",
    });
  } finally {
    if (previous === undefined) {
      delete process.env.DISCORD_SONG_REQ_WEBHOOK;
    } else {
      process.env.DISCORD_SONG_REQ_WEBHOOK = previous;
    }
  }
});


test("request API rejects missing required fields before persistence", async (t) => {
  let createCalls = 0;
  t.mock.method(songRequestService, "create", async () => {
    createCalls += 1;
    throw new Error("should not be called");
  });

  const response = await requestPOST(new Request("https://example.com/api/song-request", {
    method: "POST",
    body: JSON.stringify({ artist: "Artist" }),
    headers: { "Content-Type": "application/json" },
  }));

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "Invalid song request");
  assert.ok(Array.isArray(body.fields.songName));
  assert.ok(body.fields.songName.length > 0);
  assert.equal(createCalls, 0);
});

test("request API rejects invalid notification email", async () => {
  const response = await requestPOST(new Request("https://example.com/api/song-request", {
    method: "POST",
    body: JSON.stringify({
      songName: "Song",
      artist: "Artist",
      notifyEmail: "not-an-email",
    }),
    headers: { "Content-Type": "application/json" },
  }));

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.deepEqual(body.fields.notifyEmail, ["Invalid email address."]);
});

test("request API rejects song stories longer than 50 words", async () => {
  const response = await requestPOST(new Request("https://example.com/api/song-request", {
    method: "POST",
    body: JSON.stringify({
      songName: "Song",
      artist: "Artist",
      songStory: Array.from({ length: 51 }, () => "word").join(" "),
    }),
    headers: { "Content-Type": "application/json" },
  }));

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.deepEqual(body.fields.songStory, ["50 words maximum"]);
});
