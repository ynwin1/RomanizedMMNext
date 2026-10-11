# Spotify metadata import (P15.1)

This integration only retrieves publicly available track/artist metadata for admin review. It does not request Spotify listener access or use the Spotify playback API.

## Setup

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). The developer account must meet Spotify's current Development Mode requirements (including Premium).
2. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to the server's existing local and deployment environment settings. Do not expose either value in `NEXT_PUBLIC_` variables or commit credentials.
3. In Admin > Songs > New / Edit, or during a request's Final Review stage, paste a Spotify track URL or ID and choose **Find track**.
4. Review the returned metadata and choose **Apply metadata to form**. Saving/publishing remains a separate action.

## Data handling

- Imported: name, contributing artists, album, artwork URL, release date, duration, ISRC, Spotify ID/link, and available artist-level genre suggestions. Release date, duration and ISRC are displayed in the preview but not persisted because RomanizedMM's song model doesn't currently store them.
- Direct song form: start typing an artist name to see existing catalogue matches; selecting one fills its slug. Name-only artists can be saved with the slug blank. Imported Spotify names must still be matched deliberately against local catalogue records.
- Request-processing form: imported artists are listed as suggestions; update the separate artist resolution section manually before publishing.
- Genre values describe artists, not necessarily the track. The importer never overwrites a nonempty genre.
- The importer does not fetch lyrics and does not feed Spotify content to the AI generator.
- Album artwork and other Spotify-sourced content must follow Spotify's attribution, hyperlink and uncropped-display requirements before it is used publicly. Verify the current public display when choosing an imported image URL.

## Failure modes

The server action requires admin access before making Spotify calls. Invalid IDs, missing environment variables, unavailable tracks and Spotify HTTP failures show a recoverable message without changing the song or draft. No data is committed by the lookup itself.
