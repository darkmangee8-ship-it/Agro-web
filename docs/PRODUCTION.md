# Production checklist

## Before deploying

1. Provision an external PostgreSQL database and use its pooled connection URL for `DATABASE_URL`.
2. Set `BETTER_AUTH_SECRET` to a unique random value of at least 32 characters. Keep it server-only.
3. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the canonical deployment URL. Add the exact Vercel preview URLs if preview deployments need working authentication.
4. Generate and apply Drizzle migrations with `pnpm db:generate` and `pnpm db:migrate` before the app handles user data.
5. Run `pnpm test`, `pnpm build`, and verify signup, login, logout, and protected API behavior against the production database.
6. Promote administrators only through a trusted PostgreSQL process by setting `user.role` to `admin`; never add a public role-change endpoint.
7. Review privacy, retention, deletion, consent, incident response, and vendor agreements against applicable Nigerian privacy requirements.

## Security and verification

- Create two farmer accounts and verify that each can read and write only their own profile, activities, and financial records.
- Verify anonymous requests receive `401`, and non-admin market imports receive `403`.
- Confirm database credentials and auth secrets are absent from browser bundles and public environment variables.
- Test malformed profile fields, invalid coordinates, negative/invalid financial amounts, invalid market imports, weather-provider errors, and expired sessions.
- Verify Open-Meteo attribution and retrieval timestamps, and confirm predictive credit scoring remains disabled.
- Test migrations on a staging database and verify backups/restores before launch.

## Supabase transition note

The repository no longer contains Supabase application code. That does not delete Supabase-hosted records or accounts. No export or import of existing Supabase KV records is performed. Keep the old project available until any required data export, migration, and retention decisions are complete.
