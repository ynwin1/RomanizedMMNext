# Admin authentication

RomanizedMM admin authentication uses Clerk behind the local `infrastructure/auth` boundary.

## Required environment variables

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Keep the secret key server-side and never commit real values.

## First admin setup

1. Create or select the RomanizedMM application in Clerk.
2. Add the Clerk publishable and secret keys to the local/deployment environment.
3. Create or sign in as the first admin user.
4. In that Clerk user's public metadata, set:

```json
{
  "role": "admin"
}
```

The server-side `requireAdmin()` guard reads this metadata and permits only users with the `admin` role.

## Architecture

- Clerk-specific SDK calls stay in `infrastructure/auth/clerk-auth.ts`.
- Admin pages/actions should call `requireAdmin()`, not Clerk directly.
- `/admin` is protected in the admin root layout.
- Public routes remain public.
- Clerk middleware is composed with the existing next-intl middleware.

Do not rely on hidden UI controls as authorization. Any future admin mutation must call the server-side authorization boundary.
