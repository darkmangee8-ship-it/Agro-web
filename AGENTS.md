# AgroVision AI project guidance

This is a standalone Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4 application deployed to Vercel.

## Backend and deployment

- Use Next.js route handlers/server code, PostgreSQL, Drizzle ORM, and Better Auth.
- Do not reintroduce Supabase, Payload CMS, Figma Make runtime dependencies, or edge-function code unless the user explicitly changes the architecture.
- Vercel hosts the application, not its PostgreSQL database. Keep `DATABASE_URL`, `BETTER_AUTH_SECRET`, and other credentials server-only; never commit them or expose them through `NEXT_PUBLIC_*`.
- Use Drizzle schema definitions in `src/lib/db/schema.ts`; create and commit migrations under `drizzle/` with `pnpm db:generate`.
- Do not apply database migrations or delete remote data without explicit authorization. Existing Supabase cloud resources are separate from this repository and are not deleted by source changes.

## Authentication and data integrity

- Use Better Auth for public account/session behavior. Never implement custom password or cookie-session handling.
- Every private API route must verify the Better Auth session server-side and derive ownership from `session.user.id`; never accept an owner ID from request data.
- Validate and allowlist user-submitted fields on the server. Keep account roles server-owned; never trust a client-supplied role.
- Treat farm profiles, activities, and financial records as private. Market data is shared; imports require a server-verified administrator role.
- Keep secrets out of browser bundles and avoid logging credentials or private record contents.

## Project structure and checks

- Frontend routes: `src/app/(frontend)/`
- Next route handlers: `src/app/(frontend)/api/`
- Database connection/schema: `src/lib/db/`
- Better Auth config/client: `src/lib/auth.ts`, `src/lib/auth-client.ts`
- Domain calculations: `src/lib/domain.ts`
- Run `pnpm test` and `pnpm build` after relevant changes. Use the installed Next.js documentation in `node_modules/next/dist/docs/` for version-specific App Router behavior.
- Configure production environment variables in Vercel Project Settings. Never request users to paste secrets into chat.
