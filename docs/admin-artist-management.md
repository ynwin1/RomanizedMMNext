# Artist management (P3.5)

Admins can create artists at /admin/artists/new and edit existing records at /admin/artists/[slug]/edit. The slug is supplied at creation and intentionally immutable in this editor because it is part of public routes and song artist references.

Server actions authorize before form decoding or persistence. ArtistService owns strict runtime validation and repository contracts own persistence. Required names, image URLs, artist types, genres, song IDs, members, optional URLs, and social links are validated before Mongo access. Unknown fields are rejected. The legacy public artist POST now passes unknown JSON through the same service validation instead of trusting a TypeScript cast.

Optional profile fields can be cleared. Empty origins, labels, members, and social links are stored as absent where appropriate; the song list may be empty. Artist likes are not exposed in the admin editor and are therefore not overwritten by profile edits.

Edits use Mongo __v as an optimistic revision and increment it atomically. Legacy records without __v are treated as revision zero. Stale forms cannot overwrite newer changes; updates never upsert. Duplicate slugs are translated into an explicit create error.

Tests cover schemas, form decoding, authorization order, service validation, success/error behavior, duplicate slugs, revision conflicts, optional clearing, model write options, and the public API validation path. Live Mongo and browser checks remain manual.

Local check with a test database:
1. Create an artist with a new lowercase slug, image URL, type, genre, and optional profile data.
2. Confirm it appears in the admin list and public artist catalogue.
3. Edit biography, links, genres, members, and song IDs; reload and verify the saved values.
4. Clear optional values and verify they stay cleared.
5. Try a duplicate slug and invalid URL/type/song ID and verify no write occurs.
6. Open the same artist in two tabs; save one, then save the stale tab and verify the conflict message.
7. Confirm unauthorized sessions cannot save.
