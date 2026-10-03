# Admin shell (P3.2)

The protected admin root layout provides the shared responsive navigation and imports the site stylesheet. Overview, songs, artists, and requests use unlocalized /admin routes. Section routes are explicit placeholders until P3.3 adds real read models; they do not imply that the database is empty.

The admin layout retains the server-side requireAdmin gate. Future data access and mutations must authorize at their server entry point as documented in admin-auth.md.

Navigation supports nested management routes without activating Overview or similarly prefixed routes. The shared loading boundary announces progress; the error boundary offers retry without displaying internal error details. The sidebar stays visible while child content loads or fails.

## Verification

Navigation regression tests run with npm test. CI runs dependency installation, boundary checks, TypeScript, tests, and the production build.

Manual authenticated check: visit /admin and all three section links, refresh a section URL, check its active navigation item, and resize to mobile width. Use keyboard navigation to verify the skip link and links. Anonymous and non-admin requests must still be denied by the existing auth gate.

## Development rule

Add meaningful regression tests alongside newly introduced business logic in each subphase. Do not defer coverage to phase closeout.
