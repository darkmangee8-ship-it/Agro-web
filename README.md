# AgroVision AI

**Smarter Farming. Stronger Farmers. Better Harvests.**

AgroVision AI is a Nigeria-focused agricultural decision-support platform. It connects farm records, transparent agronomic recommendations, Open-Meteo forecasts, verified market observations, and explainable financial-readiness calculations.

## Stack

- Next.js 16 App Router and React 19
- Vercel for web hosting and server-side API routes
- External PostgreSQL for application data
- Drizzle ORM for schema management and queries
- Better Auth for email/password accounts and database-backed sessions

Supabase and the Figma Make/Payload runtime have been removed from the application code. The app expects an external PostgreSQL connection; Vercel hosting itself does not provide a PostgreSQL database.

## Local development

1. Install Node.js and pnpm versions supported by `package.json`.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_SITE_URL`.
4. Generate the SQL migration with `pnpm db:generate` and apply it with `pnpm db:migrate`.
5. Start the app using `pnpm dev`.

Use a hosted PostgreSQL provider with a connection pooler for Vercel serverless functions. Use the pooled connection string for `DATABASE_URL` and keep all credentials server-only. Configure the Vercel production and preview domains in `BETTER_AUTH_URL`/`NEXT_PUBLIC_SITE_URL` and Better Auth trusted origins as appropriate.

## Vercel deployment

Import this repository into Vercel as a Next.js project. The default build command is `pnpm build`; add the four environment variables from `.env.example` in Vercel Project Settings. Create the PostgreSQL database, then run `pnpm db:migrate` from an environment with the database URL before using authentication or app data. Do not expose `DATABASE_URL` or `BETTER_AUTH_SECRET` with a `NEXT_PUBLIC_` prefix.

Generate a strong random `BETTER_AUTH_SECRET` of at least 32 characters and configure it directly in Vercel's environment-variable UI. Do not commit it or paste it into source files.

## Existing Supabase data

Removing the Supabase client, Edge Function, KV implementation, migration, and project identifier from this repository does **not** delete the remote Supabase project or export its records. Existing account passwords/sessions and KV data are not migrated by this code change. If those records need to be retained, export them from Supabase first and plan/import them into the new PostgreSQL schema before shutting down the old project. Supabase-managed password hashes may not be portable to the new auth provider; users may need to create new passwords.

## Data and security

- Better Auth validates sessions on the server; every app data endpoint checks the session and derives ownership from the authenticated user.
- The administrator role is server-owned and cannot be selected at signup. To grant an administrator, update the user's `role` in the PostgreSQL `user` table through a trusted database admin process.
- Farm records and financial records are private to each account. Market observations are shared; imports require the server-side administrator role.
- Financial readiness is a transparent rules-based summary, not a credit score or lender decision. Predictive credit scoring remains disabled.
- Market data is reported as unavailable until verified observations are imported. No prices are fabricated.

## Data sources and limitations

- Weather: Open-Meteo forecast API. Forecasts are uncertain and are not confirmed field conditions.
- Recommendation labels reference general FAO soil, water, and pest-management principles; rules are not locally validated predictive models.
- Markets: no live Nigerian price provider is assumed. Administrators can import observations after reviewing source terms.

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for deployment checks and known limitations.
