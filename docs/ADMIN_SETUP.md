# Agro Web administrator and lending setup

This guide follows the current Better Auth, PostgreSQL, Drizzle, farmer, sponsor, and admin workflow. It does not create an administrator automatically, run a database migration, or approve any real loan.

## 1. Prepare the application and database

1. Use a supported Node.js version from `package.json` (currently Node.js 24.22.1 or newer) and install the repository dependencies with pnpm.
2. Provision PostgreSQL with a provider separate from Vercel. Use the provider's recommended pooled connection URL for serverless deployments.
3. Configure these server/runtime environment values locally in `.env.local` and in Vercel Project Settings for each deployment environment:
   - `DATABASE_URL`: PostgreSQL connection URL. Server-only.
   - `BETTER_AUTH_SECRET`: unique random secret of at least 32 characters. Server-only; generate and enter it directly in the environment manager.
   - `BETTER_AUTH_URL`: canonical site origin, such as `https://your-domain.example` (no trailing route path).
   - `NEXT_PUBLIC_SITE_URL`: canonical site origin used for metadata and auth origin configuration.
4. Never commit `.env.local`, put database/auth secrets in `NEXT_PUBLIC_*`, or paste secrets into chat.
5. Apply the committed Drizzle migrations with `pnpm db:migrate` from a trusted environment configured for the intended database. This applies the core schema and lending tables. The migration is not applied merely because it is committed.
6. For production, first test the migration and a backup/restore on staging. Do not use a destructive schema reset against a database containing data.
7. Start locally with `pnpm dev`, then check `pnpm test` and `pnpm build`.

## 2. Create and promote the first administrator

There is deliberately no admin signup form or public role-change endpoint. Every public signup starts with the `farmer` role.

1. Open `/create-account` on the intended site and create an account using the administrator's work email. Complete signup and confirm you can sign in at `/sign-in`.
2. In your database provider's authenticated SQL editor or a trusted `psql` session, update **only that account's** `user.role` to `admin`. The table name is case-sensitive/reserved, so quote it as `"user"`. Use an email you control and check that the update returns exactly one row with role `admin`.
3. Do not update all users, set a default role, accept a role from a request, or expose this SQL as an application endpoint. Keep a record of who authorized this initial privilege grant.
4. Sign out and sign back in at `/sign-in`, then open `/app/admin`. The administrator section is only useful after the new role is stored in PostgreSQL.
5. Create a second, non-admin test account and verify that it cannot access `/api/app/admin/lending`, approve sponsors, or use admin market imports.

Example SQL shape (replace the placeholder with the administrator's exact email inside the trusted database tool):

```sql
UPDATE "user"
SET role = 'admin', updated_at = now()
WHERE lower(email) = lower('admin@example.com')
  AND role = 'farmer'
RETURNING id, email, role;
```

If the statement returns no row, first verify that the account completed signup in this same database and inspect only its email and role. Do not inspect or export password/authentication fields.

## 3. Register and approve a sponsor

1. The bank, microfinance institution, cooperative, or other lender opens `/sponsor/create-account` and creates its separate portal account. Returning sponsor users sign in at `/sponsor/sign-in`.
2. Signup records the organization name/type and submits a verification request. Until approval, the user remains a regular farmer-role account and cannot read sponsor applications.
3. The administrator signs in and opens `/app/admin`. In **Sponsor verification**, check the organization's identity and authority outside the app using your organization's approved due-diligence process.
4. Select **Approve** only after verification. Approval changes the account's server-owned role to `sponsor` and unlocks the sponsor workspace. Reject requests that cannot be verified.
5. Ask the sponsor to sign out and back in through `/sponsor/sign-in` after approval. Its workspace is `/app/sponsor`.

## 4. Farmer application workflow

1. Farmers create accounts at `/create-account` and sign in at `/sign-in`.
2. They complete the farm details in **My Farm**, record sales and expenses in **Financial Identity**, and add farm activity records.
3. **Credit Assessment** shows the current application checklist. A farmer can submit only after recording: state and LGA; positive farm size; at least one crop; at least four total sales/expense records including at least one sale and one expense; and at least three farm activity records.
4. Passing the checklist means only that the application record is complete. It is not a credit score, an eligibility/approval decision, or a guarantee of funds.
5. The farmer enters the amount, term, purpose, and repayment plan, then explicitly consents to sharing the application with approved sponsors. The sponsor dashboard shows only the application fields and state/LGA-level farm summary needed for review.
6. The sponsor reviews a farmer's shared request and may send an indicative offer. The displayed interest/repayment figures are estimates, not a signed contract or disbursement commitment.
7. The farmer reviews and accepts or declines. The farmer can withdraw the application to revoke sponsor visibility. A real lender must complete its own regulated underwriting, identity verification, disclosures, contract, and disbursement outside this prototype workflow.

## 5. Administrator's normal operations

1. Open `/app/admin` to review the registered farmer list, sponsor organizations, and submitted loan requests.
2. Verify sponsor entities before approving them. Re-check that account email and organization details correspond to the organization being authorized.
3. Add a reason when marking an application reviewed or declined. Admin actions and sensitive dashboard access are recorded in the lending audit table.
4. Farmers' records are sensitive. Access them only for a documented program purpose and do not export/share more than necessary.
5. Market imports remain a separate admin feature and do not imply any loan approval authority.
6. Revoke a compromised admin role only through a trusted database process. Preserve an alternate, controlled break-glass admin process so the system cannot be orphaned.

## 6. Production gates before real lending

- Obtain Nigerian legal/compliance review for lender licensing, consumer disclosures, rates/fees, privacy, retention, complaints, and consent.
- Do not collect NIN, BVN, or bank-account numbers in this app. If identity checks or payouts are later added, use a vetted provider with a secure tokenized integration and a separately reviewed data flow.
- The app does not execute contracts, verify source documents, score creditworthiness, move money, or disburse loans.
- Test role boundaries, consent and withdrawal, audit records, backup/restore, rate limits, email/password recovery, monitoring, and incident response in staging before launch.
- Review `docs/PRODUCTION.md` and the application's privacy/terms pages before inviting real users.
