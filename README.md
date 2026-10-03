# RomanizedMM
Official Website - www.romanizedmm.com

Demo - [https://www.youtube.com/watch?v=9P4RoPcO_RM](https://youtu.be/rP2xi7OrS_E)

## About
RomanizedMM is a web application providing romanized lyrics of Myanmar songs to
music lovers who want to sing Myanmar songs along.

It provides three lyric formats:
- Romanized lyrics
- Burmese lyrics
- English meaning

Song pages also include basic metadata, a short description, a "when to listen" summary, and links/players for services such as YouTube, Spotify, and Apple Music when available.

Users can submit missing songs through the Song Request flow. Requests are stored as user intent and can be reviewed by the protected admin workspace.

This repository is the Next.js version of RomanizedMM, migrated from the original MERN application to improve server rendering, SEO, maintainability, and long-term development.

## Features

1. **Lyrics**
   - Localized song pages under `/[en|my]/song/[songName]/[songId]`
   - Romanized, Burmese, and meaning views
   - Song metadata and external listening links

2. **Song requests**
   - Public song-request form
   - Request queue and admin lifecycle management

3. **Song catalogue**
   - Browse the current song collection

4. **Artist catalogue**
   - Artist profiles, metadata, and related songs

5. **Guess The Lyrics / Guess The Song**
   - Trivia game modes and leaderboard functionality

6. **Admin workspace**
   - Clerk-backed admin authentication
   - Dashboard and searchable/paginated read models
   - Song create/edit
   - Artist create/edit
   - Song-request review and lifecycle updates
   - Runtime validation, optimistic concurrency checks, and audit metadata

## Technical architecture

RomanizedMM uses:
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- MongoDB / Mongoose
- Next-Intl
- Clerk for admin authentication
- Zod for runtime validation

The application is organized around domain modules under `modules/`. UI/routes depend on module public/application APIs rather than importing persistence models directly. MongoDB access lives in module infrastructure repositories, while authentication, logging, and database connection concerns live under `infrastructure/`.

Admin mutations follow a guarded flow:

```text
parse input
→ validate command
→ authorize admin
→ application service
→ repository
→ typed result / redirect
```

Admin writes use optimistic `__v` revision checks to prevent stale overwrites. Canonical admin-managed records expose timestamps and the last admin actor where available.

## Validation and CI

Pull requests run:
- dependency installation
- module-boundary/security guard checks
- TypeScript type checking
- automated tests
- production build

Run locally:

```bash
npm ci
npm run check:boundaries
npm run typecheck
npm test
npm run build
```

The test suite covers service/repository behavior, API contracts, auth decisions, admin actions, validation, read models, auditability, and deterministic admin integration flows.

Browser E2E with Clerk is intentionally deferred until a disposable Clerk + Mongo test environment is available.

## Selected libraries
- Clerk
- Mongoose
- Next-Intl
- Zod
- React Player
- React Select
- React Timer Hook
- Use Debounce
