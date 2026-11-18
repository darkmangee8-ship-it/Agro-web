# AgroVision AI

**Smarter Farming. Stronger Farmers. Better Harvests.**

AgroVision AI is a Nigeria-focused agricultural decision-support platform. It connects farm records, transparent agronomic recommendations, live Open-Meteo forecasts, verified market observations, and explainable financial-readiness calculations.

## Current architecture

This Figma Make runtime uses Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase Auth, a Supabase Edge Function, and PostgreSQL. The original brief requested Vite plus FastAPI. Make's connected runtime deploys Next.js and Deno Edge Functions instead, so those two layers are a documented platform substitution; the REST boundaries and service modules remain separable for a future FastAPI deployment.

Payload remains installed as platform scaffolding but does not store AgroVision user data. Supabase is the application identity and data authority.

## Implemented

- Public marketing, support, privacy, terms, and responsible-AI pages.
- Supabase email/password registration, login, logout, and protected workspace.
- Server-verified record ownership; privileged market imports check `app_metadata.role`.
- Farm profile and activity timeline.
- Transparent, rule-based farm recommendations with evidence status and limitations.
- Live Open-Meteo current conditions, seven-day forecast, attribution, failure states, and agricultural alert rules.
- Verified market observation import/search with honest empty and forecasting-disabled states.
- Sales/expense records, charting, explainable indicators, consent flag, and financial-readiness result.
- Predictive credit model disabled until a lawful repayment-outcome dataset passes validation.
- Normalized PostgreSQL migration with constraints, indexes, foreign keys, and RLS policies.

## Local setup

1. Use Node and pnpm versions from `.mise.toml`.
2. Run `pnpm install`.
3. Connect Supabase through Figma Make. The generated public project information is in `utils/supabase/info.tsx`.
4. Deploy `supabase/functions/server/index.tsx` through the Make/Supabase workflow.
5. Apply `supabase/migrations/202604260001_agrovision_foundation.sql` in a reviewed Supabase migration workflow.
6. Configure Supabase Auth site and redirect URLs for each environment.
7. Set `ALLOWED_ORIGINS` on the Edge Function in production.
8. Run `pnpm build`. The development server is managed automatically by Figma Make.

## Security posture

- The Edge Function verifies access tokens with Supabase Auth and derives ownership from the verified user, not the request body.
- Administrator status comes only from server-controlled `app_metadata`.
- Financial records are private and never exposed through public routes.
- Service-role credentials remain server-only.
- The normalized schema enables RLS on private tables.
- Market imports validate required values and preserve source, unit, date, and verification status.

Before production launch, complete an independent security review, apply and test the relational migration, move KV repositories to normalized tables, configure private storage policies for evidence uploads, test backups/restores, and obtain Nigerian privacy/legal review.

## Data sources

- Weather: [Open-Meteo](https://open-meteo.com/) forecast API. No API key is required. Coverage and licensing must be reviewed for the final production use.
- Agronomic recommendation labels reference general FAO integrated soil, water, and pest-management principles. Current rules are not locally validated predictive models.
- Markets: no live Nigerian price provider is assumed. Administrators can import verified observations after reviewing source terms. No prices are fabricated.

## Financial and AI limitations

The readiness calculation totals recorded revenue and expenses, computes operating surplus, and scores record completeness from explicit rules. It is not a credit score, default probability, lender decision, or guarantee. No predictive model is deployed and no synthetic repayment labels are used.

## Deployment

- **Frontend:** publish through Figma Make's managed Next.js deployment. Set the production site URL and verify all public and protected routes.
- **Supabase:** configure Auth redirects, deploy the Edge Function, apply reviewed migrations, restrict CORS, and test RLS with two separate farmer accounts.
- **Alternative FastAPI target:** port each Edge Function service route to FastAPI/Pydantic/SQLAlchemy while preserving the API contract. This is not part of the active Make runtime.

See `docs/PRODUCTION.md` for the production checklist and known blockers.
