# P13.1 — RomanizedMM experience principles

## Goal

Make it effortless to **find a song, read or sing along, and discover another song** across small phones and large screens. Longer sessions should come from genuine discovery, not obstructive navigation, autoplay traps, or artificially delayed actions.

## User journeys, in priority order

1. **Direct song landing (from Google):** Recognize the song immediately, access the lyrics and language selector without hunting, play media optionally, continue to related songs.
2. **Known-song search:** Search is visible immediately; results provide title and artist, keyboard and touch support, loading/empty/error feedback.
3. **Explore:** Browse a curated or searchable catalogue, understand artist/song relationships, and navigate back without losing context.
4. **Song request:** Find the action, understand what's required, see submission status, and avoid duplicate requests.

## Interface decisions

- Keep RomanizedMM's dark musical identity; improve contrast and hierarchy rather than introducing an unrelated aesthetic.
- Primary content first: song title, artist, lyric view and player before long biographies or supporting metadata.
- A single dominant action per view. Related songs should offer relevant onward exploration without blocking reading.
- Mobile-first: support 320px widths; no horizontal overflow; touch targets ideally at least 44×44 CSS pixels and comfortably spaced.
- Desktop navigation should expose high-use destinations; mobile navigation should be keyboard-accessible, closable with Escape, and have a clearly labelled toggle.
- Lyrics should use comfortable line height, adjustable size in a later phase, accessible switcher controls, and preserve synchronization and server-rendered text.
- Do not force media autoplay. Respect reduced-motion preferences and allow users to dismiss overlays.
- Avoid layout shifts, empty initial search boxes, and unnecessary page reloads.
- Make visible focus and a keyboard skip link foundational behavior.

## Initial audited friction and target phase

| Issue in current implementation | Proposed change | Phase |
|---|---|---|
| All navigation behind hamburger even on wide screens | Exposed desktop navigation, accessible mobile drawer | P13.2 |
| Search is null before mounting; weak feedback | SSR-safe search affordance and robust states | P13.2 |
| Extended metadata appears before lyrics | Compact song header; prioritize lyrics | P13.3 |
| Small radio controls for lyric modes | Segmented accessible modes and reading controls | P13.4 |
| Catalogue pagination and inconsistent card targets | Responsive exploration and consistent navigation | P13.5 |
| Varied mobile widths, transitions, keyboard access | Audit at 320/375/768/1280 widths; accessibility tests | P13.6 |

## Success measures

- Search-to-song completion and latency; search no-result rate
- Song detail → lyrics engagement; lyric language switching
- Song detail → another song or artist navigation
- Song request completion and errors
- Mobile/desktop breakdown of bounce/engagement, supported by actual analytics
- Accessibility checks, Core Web Vitals and manual keyboard/mobile testing

Do **not** optimize time-on-site in isolation; long sessions caused by confusing navigation are a failure.

## Scope of P13.1

This PR adds reusable color tokens, visible focus indication, a keyboard skip link, and motion preferences. It intentionally makes no major layout changes. Later PRs will update individual components under tests, preserving existing song URLs and SEO behavior.
