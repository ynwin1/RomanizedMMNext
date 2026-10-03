import test from "node:test";
import assert from "node:assert/strict";

import { triviaService } from "@/modules/trivia";
import { songRequestService, type CreateSongRequestInput } from "@/modules/requests";
import { GameMode } from "@/app/lib/constants";
import { createTriviaScore } from "@/app/actions/trivia.action";
import { createSongRequest } from "@/app/actions/song-request.action";

function triviaFormData() {
  const formData = new FormData();
  formData.set("userName", "Player");
  formData.set("country", "Canada");
  formData.set("score", "10");
  formData.set("gameMode", GameMode.GuessTheLyrics);
  return formData;
}

function requestFormData() {
  const formData = new FormData();
  formData.set("songName", "Requested Song");
  formData.set("artist", "Requested Artist");
  formData.set("youtubeLink", "");
  formData.set("details", "");
  formData.set("requestedBy", "");
  formData.set("songStory", "");
  formData.set("notifyEmail", "");
  return formData;
}

test("trivia action reports success only when score persistence succeeds", async (t) => {
  t.mock.method(triviaService, "saveScore", async () => {});

  const result = await createTriviaScore({}, triviaFormData());

  assert.deepEqual(result, { message: "Score saved successfully" });
});

test("trivia action reports failure when score persistence fails", async (t) => {
  t.mock.method(triviaService, "saveScore", async () => {
    throw new Error("database unavailable");
  });

  const result = await createTriviaScore({}, triviaFormData());

  assert.deepEqual(result, {
    message: "Failed to save score. Please try again!",
    errors: {},
  });
});

test("song request action redirects to success when webhook is missing after persistence", async (t) => {
  const previous = process.env.DISCORD_SONG_REQ_WEBHOOK;
  delete process.env.DISCORD_SONG_REQ_WEBHOOK;

  t.mock.method(songRequestService, "create", async (input: CreateSongRequestInput) => ({
    id: "request-id",
    ...input,
  }));

  try {
    await assert.rejects(
      () => createSongRequest("en", {}, requestFormData()),
      (error: any) =>
        typeof error?.digest === "string" &&
        error.digest.includes("NEXT_REDIRECT") &&
        error.digest.includes("/en/song-request/success"),
    );
  } finally {
    if (previous === undefined) {
      delete process.env.DISCORD_SONG_REQ_WEBHOOK;
    } else {
      process.env.DISCORD_SONG_REQ_WEBHOOK = previous;
    }
  }
});

test("song request action redirects to success when Discord fails after persistence", async (t) => {
  const previous = process.env.DISCORD_SONG_REQ_WEBHOOK;
  process.env.DISCORD_SONG_REQ_WEBHOOK = "https://discord.example/webhook";

  t.mock.method(songRequestService, "create", async (input: CreateSongRequestInput) => ({
    id: "request-id",
    ...input,
  }));
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));

  try {
    await assert.rejects(
      () => createSongRequest("en", {}, requestFormData()),
      (error: any) =>
        typeof error?.digest === "string" &&
        error.digest.includes("NEXT_REDIRECT") &&
        error.digest.includes("/en/song-request/success"),
    );
  } finally {
    if (previous === undefined) {
      delete process.env.DISCORD_SONG_REQ_WEBHOOK;
    } else {
      process.env.DISCORD_SONG_REQ_WEBHOOK = previous;
    }
  }
});


test("song request action redirects to error when persistence fails", async (t) => {
  const previous = process.env.DISCORD_SONG_REQ_WEBHOOK;
  delete process.env.DISCORD_SONG_REQ_WEBHOOK;

  t.mock.method(songRequestService, "create", async () => {
    throw new Error("database unavailable");
  });

  try {
    await assert.rejects(
      () => createSongRequest("en", {}, requestFormData()),
      (error: any) =>
        typeof error?.digest === "string" &&
        error.digest.includes("NEXT_REDIRECT") &&
        error.digest.includes("/en/song-request/error"),
    );
  } finally {
    if (previous === undefined) {
      delete process.env.DISCORD_SONG_REQ_WEBHOOK;
    } else {
      process.env.DISCORD_SONG_REQ_WEBHOOK = previous;
    }
  }
});
