import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("game modes have theme-aware responsive cards with real navigation", () => {
  const hub = source("app/(pages)/[locale]/(songs)/game-modes/page.tsx");
  assert.match(hub, /grid-cols-1 gap-4 md:grid-cols-2/);
  assert.match(hub, /border-theme-border bg-surface/);
  assert.match(hub, /href={`\.\/game-modes\/\$\{game\.href\}`}/);
  assert.doesNotMatch(hub, /hover:scale-105|bg-gradient-to-br/);
});

test("both game pages keep the ambient video without blocking the game controls", () => {
  for (const game of ["guess-the-lyrics", "guess-the-song"]) {
    const page = source(`app/(pages)/[locale]/(songs)/game-modes/${game}/page.tsx`);
    assert.match(page, /Player src="\/GTL\.mp4"/);
    assert.match(page, /pointer-events-none fixed/);
    assert.match(page, /motion-reduce:hidden/);
    assert.match(page, /<Trivia songs={allSongs} minScore={minScore}/);
  }
});

test("gameplay controls and leaderboard fit small screens and preserve score interaction", () => {
  const lyrics = source("app/components/guess-the-lyrics/Trivia.tsx");
  const song = source("app/components/guess-the-song/TriviaCard.tsx");
  const leaderboard = source("app/components/guess-the-lyrics/Leaderboard.tsx");
  const scoreForm = source("app/components/forms/TriviaScoreForm.tsx");
  const audio = source("app/components/guess-the-song/AudioPlayer.tsx");
  for (const quiz of [lyrics, song]) {
    assert.match(quiz, /grid-cols-1 gap-3 sm:grid-cols-2/);
    assert.match(quiz, /setScore\(\(score: number\) => score \+ 1\)/);
    assert.match(quiz, /setTriviaState\(TriviaState\.End\)/);
    assert.doesNotMatch(quiz, /w-\[40vw\]|w-\[80vw\]/);
  }
  assert.match(leaderboard, /overflow-x-auto/);
  assert.match(leaderboard, /No scores yet/);
  assert.match(scoreForm, /w-full max-w-lg/);
  assert.match(audio, /<button\s+type="button"\s+disabled={hasError \|\| !isReady}/);
});
