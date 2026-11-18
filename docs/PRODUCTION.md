# Production checklist and known limitations

## Required manual actions

1. Apply the relational migration and replace the Make KV repository calls with table repositories before handling sensitive production financial documents.
2. Configure Supabase Auth email verification, recovery email templates, site URL, and allowed redirects.
3. Create a private evidence bucket with owner-scoped storage RLS and MIME/size checks before enabling uploads.
4. Set `ALLOWED_ORIGINS` to exact frontend origins; do not leave permissive development behavior in production.
5. Assign advisers and administrators through a trusted server process using `app_metadata`. Never accept role changes from the browser.
6. Select and legally review Nigerian market data sources before import.
7. Review privacy, retention, deletion, consent, incident-response, and vendor agreements against the Nigeria Data Protection Act and current regulator guidance.
8. Configure monitoring for Edge Function errors, weather failures, auth anomalies, import rejections, and backup restores.

## Verification

- Create two farmer accounts and prove each receives `401/403` for the other's resources.
- Confirm public bundles contain only the anon key, never a service-role key.
- Test malformed coordinates, negative amounts, duplicate market rows, stale observations, provider timeout, and expired sessions.
- Verify Open-Meteo attribution and retrieval timestamps.
- Verify predictive credit scoring remains disabled.
- Run `pnpm build` and `figma make verify-deploy`, then visit every generated public route.

## Deployment status

The repository is prepared for the connected Make/Supabase environment. No external production URL or deployed FastAPI service is claimed. Live weather requires successful network access from the deployed Edge Function. Market data remains unavailable until a verified source is imported.
