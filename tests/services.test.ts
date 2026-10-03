import test from "node:test";
import assert from "node:assert/strict";

import { SongService } from "@/modules/songs/application/song.service";
import type { ISongRepository } from "@/modules/songs/application/song.repository";
import type { SongEntity } from "@/modules/songs/domain/song.types";
import { ArtistService } from "@/modules/artists/application/artist.service";
import type { IArtistRepository } from "@/modules/artists/application/artist.repository";
import type { ArtistEntity } from "@/modules/artists/domain/artist.types";
import { SongRequestService } from "@/modules/requests/application/song-request.service";
import type { ISongRequestRepository } from "@/modules/requests/application/song-request.repository";
import { TriviaService } from "@/modules/trivia/application/trivia.service";
import type { ITriviaRepository } from "@/modules/trivia/application/trivia.repository";
import { GameMode } from "@/modules/trivia/domain/game-mode";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { AnalyticsService } from "@/modules/analytics/application/analytics.service";
import type { ICountryStatRepository } from "@/modules/analytics/application/country-stat.repository";

const song: SongEntity = {
  id: "song-1",
  mmid: 17,
  songName: "Test Song",
  artistName: [{ name: "Test Artist", slug: "test-artist" }],
  genre: "Pop",
  about: "About",
  whenToListen: "Anytime",
  lyrics: "lyrics",
  romanized: "romanized",
  burmese: "burmese",
  meaning: "meaning",
};

function songRepository(overrides: Partial<ISongRepository> = {}): ISongRepository {
  return {
    listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0,
    create: async input => ({ id: "song-1", ...input }),
    update: async () => song,
    findForEdit: async () => ({ ...song, revision: 0 }),
    findByMmid: async () => song,
    searchByTitle: async () => [],
    findRandom: async () => null,
    findLatest: async () => [],
    findByMmids: async () => [],
    listForSitemap: async () => [],
    listCatalogue: async () => [],
    listGuessLyricsSongs: async () => [],
    listGuessSongRecords: async () => [],
    findByArtistName: async () => [],
    ...overrides,
  };
}

test("song page smoke: SongService returns the canonical song", async () => {
  const service = new SongService(songRepository());
  assert.deepEqual(await service.getSongPage(17), song);
});

test("SongService throws NotFoundError for a missing song", async () => {
  const service = new SongService(songRepository({ findByMmid: async () => null }));
  await assert.rejects(() => service.getByMmid(999), NotFoundError);
});

test("search smoke: SongService delegates the query unchanged", async () => {
  let received = "";
  const expected = [{ songName: "Hello", mmid: 1, artistName: [{ name: "A" }] }];
  const service = new SongService(songRepository({
    searchByTitle: async (query) => {
      received = query;
      return expected;
    },
  }));

  assert.deepEqual(await service.search("hello"), expected);
  assert.equal(received, "hello");
});

test("random song smoke: SongService returns repository result", async () => {
  const expected = { songName: "Random", mmid: 42 };
  const service = new SongService(songRepository({ findRandom: async () => expected }));
  assert.deepEqual(await service.getRandomSong(), expected);
});

const artist: ArtistEntity = {
  id: "artist-1",
  name: "Test Artist",
  slug: "test-artist",
  imageLink: "https://example.com/a.jpg",
  type: "solo",
  musicGenre: ["Pop"],
  songs: [17, 22],
  likes: 0,
};

function artistRepository(overrides: Partial<IArtistRepository> = {}): IArtistRepository {
  return {
    listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0,
    findBySlug: async () => artist,
    findForEdit: async () => ({ ...artist, revision: 0 }),
    findFirstBySlugs: async () => artist,
    listCatalogue: async () => ({ artists: [], totalPages: 0 }),
    create: async () => artist,
    update: async () => artist,
    ...overrides,
  };
}

test("artist page smoke: ArtistService returns profile by slug", async () => {
  const service = new ArtistService(artistRepository());
  assert.deepEqual(await service.getBySlug("test-artist"), artist);
});

test("ArtistService throws NotFoundError for a missing artist", async () => {
  const service = new ArtistService(artistRepository({ findBySlug: async () => null }));
  await assert.rejects(() => service.getBySlug("missing"), NotFoundError);
});

test("ArtistService preserves requested artist priority when repository resolves a profile", async () => {
  let slugsReceived: string[] = [];
  const service = new ArtistService(artistRepository({
    findFirstBySlugs: async (slugs) => {
      slugsReceived = slugs;
      return artist;
    },
  }));

  assert.deepEqual(await service.getFirstProfileBySlugs(["first", "second"]), artist);
  assert.deepEqual(slugsReceived, ["first", "second"]);
});

test("request submission smoke: SongRequestService delegates creation", async () => {
  const input = { songName: "Requested Song", artist: "Artist" };
  const created = { id: "request-1", ...input, status: "pending" as const };
  let received: unknown;

  const repository: ISongRequestRepository = {
    create: async (value) => {
      received = value;
      return created;
    },
    listQueue: async () => [],
    listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0,
    findAdminDetail: async () => null,
    updateStatus: async () => null,
    findById: async () => null,
  };

  const service = new SongRequestService(repository);
  assert.deepEqual(await service.create(input), created);
  assert.deepEqual(received, input);
});

function triviaRepository(overrides: Partial<ITriviaRepository> = {}): ITriviaRepository {
  return {
    create: async (input) => ({
      id: "new-score",
      date: new Date("2026-01-01"),
      ...input,
    }),
    listByGameMode: async () => [],
    findMinimumScore: async () => null,
    deleteById: async () => {},
    ...overrides,
  };
}

test("trivia smoke: empty leaderboard has minimum score 0", async () => {
  const service = new TriviaService(triviaRepository());
  assert.equal(await service.getMinimumScore(GameMode.GuessTheLyrics), 0);
});

test("TriviaService trims the lowest score when leaderboard exceeds 10", async () => {
  const deleted: Array<{ id: string; gameMode: GameMode }> = [];
  const scores = Array.from({ length: 11 }, (_, index) => ({
    id: `score-${index}`,
    userName: `Player ${index}`,
    score: 100 - index,
    country: "🇨🇦",
    date: new Date("2026-01-01"),
    gameMode: GameMode.GuessTheSong,
  }));

  const service = new TriviaService(triviaRepository({
    listByGameMode: async () => scores,
    deleteById: async (id, gameMode) => {
      deleted.push({ id, gameMode });
    },
  }));

  await service.saveScore({
    userName: "New Player",
    score: 50,
    country: "🇨🇦",
    gameMode: GameMode.GuessTheSong,
  });

  assert.deepEqual(deleted, [{
    id: "score-10",
    gameMode: GameMode.GuessTheSong,
  }]);
});

test("TriviaService does not trim a leaderboard with 10 or fewer scores", async () => {
  let deleteCalls = 0;
  const scores = Array.from({ length: 10 }, (_, index) => ({
    id: `score-${index}`,
    userName: `Player ${index}`,
    score: 10 - index,
    country: "🇨🇦",
    date: new Date("2026-01-01"),
    gameMode: GameMode.GuessTheLyrics,
  }));

  const service = new TriviaService(triviaRepository({
    listByGameMode: async () => scores,
    deleteById: async () => { deleteCalls += 1; },
  }));

  await service.saveScore({
    userName: "Player",
    score: 5,
    country: "🇨🇦",
    gameMode: GameMode.GuessTheLyrics,
  });

  assert.equal(deleteCalls, 0);
});


test("analytics service delegates country tracking to the repository", async () => {
  let received: { country: string; code: string } | null = null;
  const expected = {
    id: "country-1",
    country: "Canada",
    code: "CA",
    count: 12,
  };

  const repository: ICountryStatRepository = {
    increment: async (country, code) => {
      received = { country, code };
      return expected;
    },
    listTop: async () => [],
  };

  const service = new AnalyticsService(repository);

  assert.deepEqual(await service.trackCountry("Canada", "CA"), expected);
  assert.deepEqual(received, { country: "Canada", code: "CA" });
});


test("analytics service requests the top 10 countries by default", async () => {
  let receivedLimit = 0;
  const expected = [
    { id: "ca", country: "Canada", code: "CA", count: 20 },
    { id: "us", country: "United States", code: "US", count: 15 },
  ];

  const repository: ICountryStatRepository = {
    increment: async () => null,
    listTop: async (limit) => {
      receivedLimit = limit;
      return expected;
    },
  };

  const service = new AnalyticsService(repository);

  assert.deepEqual(await service.getTopCountries(), expected);
  assert.equal(receivedLimit, 10);
});

test("admin module services validate queries before repository access", async () => {
  let calls = 0;
  const listAdmin = async () => { calls += 1; return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }; };
  const services = [
    new SongService(songRepository({ listAdmin })),
    new ArtistService(artistRepository({ listAdmin })),
    new SongRequestService({ create: async input => ({ id: "r", ...input }), listQueue: async () => [], listAdmin, countAdmin: async () => 0, findAdminDetail: async () => null, updateStatus: async () => null, findById: async () => null }),
  ];
  for (const service of services) await assert.rejects(() => service.getAdminList({ page: -1 }));
  assert.equal(calls, 0);
  for (const service of services) await service.getAdminList({});
  assert.equal(calls, 3);
});

test("request service rejects unsupported admin statuses before querying", async () => {
  let calls = 0;
  const service = new SongRequestService({
    create: async input => ({ id: "r", ...input }), listQueue: async () => [],
    listAdmin: async () => { calls += 1; return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }; },
    countAdmin: async () => { calls += 1; return 0; },
    findAdminDetail: async () => null, updateStatus: async () => null, findById: async () => null,
  });
  await assert.rejects(() => service.getAdminList({ status: "added" }));
  assert.equal(calls, 0);
});
