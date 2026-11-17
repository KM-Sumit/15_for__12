# EduSphere multi-tenancy

EduSphere is one application that hosts many isolated coaching institutes. This document is the
operator/developer reference for the tenant model, database isolation, module switches, accounts,
and deployment order.

> **Do not edit or re-run migrations against the hosted production database without a backup.**
> The local validation workflow below uses a throwaway database and never touches a hosted URL.

## 1. Tenant model

| Object | Purpose |
| --- | --- |
| `institutes` | One row per coaching institute. `slug` drives `/i/[slug]` and the branded login page. |
| `institute_memberships` | Verified link between a `users` row and one institute. `user_id` is UNIQUE (one institute per account). |
| `plans` | Platform plans. `modules` is the default module list for institutes on that plan. |
| `institute_modules` | Per-institute overrides of the plan module list. |
| `institute_settings` | Per-institute branding/contact settings. |
| `platform_settings` | Platform brand, support contacts, footer copy. |
| tenant tables | Every table that carries `institute_id` (tests, questions, attempts, files, payments, materials, …). |

`users.institute_id` is mirrored for convenience only. The **membership row is authoritative**.
The browser never supplies a tenant id. On every request `hooks.server.ts` loads the signed-in
user, reads the active membership, and overrides `locals.user.role` / `locals.user.instituteId`
from that membership.

Roles: `student`, `teacher`, `admin`, `super_admin`.

- `super_admin` has no tenant. It uses the `/super` console and bypasses tenant filters.
- `admin` is the institute owner/manager. `teacher` is staff. `student` is the learner.
- A disabled/suspended membership or institute ends the session and redirects to `/login`.

## 2. Database isolation (PostgreSQL RLS)

Migration `drizzle/0009_multitenant.sql` adds `institute_id`, indexes, RLS policies and triggers.

- Every tenant table has `ENABLE ROW LEVEL SECURITY` **and** `FORCE ROW LEVEL SECURITY`.
- Policy `tenant_isolation`:
  `institute_id = current_setting('app.institute_id')::uuid OR current_setting('app.bypass_rls') = 'on'`
  for both `USING` and `WITH CHECK`.
- Trigger `app_set_institute_id()` fills `institute_id` from `app.institute_id` when the insert
  leaves it null. Passing a *different* tenant id is rejected by the `WITH CHECK` policy.
- The app reserves one connection per signed-in request (`withRequestDb`) and sets
  `app.institute_id` / `app.bypass_rls` with `set_config`. The connection is reset and returned to
  the pool in `finally`. Super-admin requests set `bypassRls: true` explicitly.
- Anonymous/public requests never query tenant tables. Public pages only read `institutes`,
  `institute_settings` and `platform_settings`.

`users`, `institute_memberships`, `institutes`, `plans`, `institute_modules`,
`institute_settings` and `platform_settings` are intentionally **not** RLS-protected. They are
platform metadata; tenant queries against `users` must filter by institution in application code.

### Things to know

- `FORCE ROW LEVEL SECURITY` protects the table owner as well, but a PostgreSQL **superuser** or a
  role with `BYPASSRLS` still bypasses it. The production application role must be a normal role.
- If the app connects through PgBouncer in transaction mode, the reserved connection + session
  GUCs still work because the same backend serves the request; keep `prepare: false` (already set).
- A script or job that needs cross-tenant access must use `withPlatformDb()`; ordinary service
  code runs inside the request scope automatically.
- Never trust `institute_id` from a form, query string, cookie or JWT. Resolve it from
  `institute_memberships`.

## 3. Migrations

```bash
# Local (docker compose)
bun run db:up
bun run db:migrate

# Any environment: MIGRATION_DATABASE_URL skips PgBouncer and hits Postgres directly
MIGRATION_DATABASE_URL=postgres://user:pass@host:5432/db bun scripts/migrate.ts
```

Order matters: `0009_multitenant.sql` creates the `legacy` institute, backfills every existing
tenant row, then creates the RLS policies/triggers. Existing rows without an institute are assigned
to `legacy`; the legacy institute is not listed publicly unless it is marked active/public by a
super admin.

The migration was validated on a fresh PostgreSQL 18 database:

1. all migrations apply cleanly;
2. inserts auto-fill `institute_id` from the session;
3. a tenant session sees only its own rows;
4. cross-tenant `UPDATE` / `DELETE` affect 0 rows;
5. cross-tenant `INSERT` fails with `new row violates row-level security policy`;
6. `bypass_rls=on` sees all rows (platform console only).

## 4. Super-admin bootstrap

1. Set `ADMIN_EMAILS` to the owner's Google address (comma-separated for several owners).
2. Sign in with that Google account. It is promoted to `super_admin` on sign-in and on each request.
3. Or, on a fresh database, the **first ever** Google account becomes `super_admin`.
4. Password sign-in is available at `/super/login` for super admins who already have a password.
   A new institute admin receives a temporary password from the super-admin institute screen.

`/super` redirects non-super users to their own home. `/admin` redirects super admins to `/super`.

## 5. Onboarding an institute

1. Sign in at `/super/login`.
2. **Institutes → New institute**: name, slug, contact details, plan.
3. **Team → Create admin**: name + email + temporary password. This creates the admin user and
   the membership. Share the password over a secure channel; the admin can change it in
   `/admin/settings`.
4. Open the institute detail page and switch modules on/off for that institute.
5. The institute admin signs in at `/login` (or the branded page `/i/[slug]/login`) and starts
   creating tests, materials and students.

Students can sign in with Google or with the password created by the institute admin. A Google
sign-in from an institute-branded login attaches the membership by institute slug. Self-service
joining is available at `/join` for accounts that are not attached yet: the student enters the
institute code (the slug shown on the institute settings screen, e.g. `vision-institute`) or
picks the institute from the public list. The code is not a secret; membership is still verified
against `institutes` and `institute_memberships` on the server.

## 6. Modules

Registry: `src/lib/features/platform/modules.ts`.

`dashboard`, `online_tests`, `test_series`, `question_bank`, `results`, `study_materials`,
`ai_generator`, `students`, `notifications`, `reports`.

A module is enabled when it is on the institute's plan **and** not explicitly disabled in
`institute_modules`. The super-admin toggle writes an override. The same registry:

- filters sidebar/tab navigation (`AppShell`);
- blocks direct page URLs in `hooks.server.ts` with a 403 page;
- returns `403 {"message":"This module is disabled for your institute."}` for `/api/*`.

`dashboard` is not route-gated on purpose so an institute can always reach its own home screen.
Super-admin routes are never tenant-gated.

## 7. Seed script (development only)

`scripts/seed.ts` is the **legacy demo seed**. It was written before multi-tenancy and:

- never creates users or memberships;
- inserts demo content with `institute_id = NULL`, which is invisible to tenant sessions under RLS;
- therefore is **not** a production provisioning tool.

Use the super-admin console to create real institutes, admins, plans and content. If you want demo
content for a tenant, create the institute first and insert data through the app or a
tenant-scoped script using `withPlatformDb()` plus an explicit `institute_id`.

Never run the demo seed against the hosted production database.

## 8. Environment

Required: `DATABASE_URL`, `AUTH_SECRET` (32+ chars), `ORIGIN` in production.

Optional but supported: `MIGRATION_DATABASE_URL`, `REDIS_URL`, Google OAuth
(`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), `ADMIN_EMAILS`, R2 uploads, Razorpay, VAPID/FCM.
See `.env.example`.

## 9. Deployment order

1. Back up the production database (and verify the backup).
2. Apply migrations with `MIGRATION_DATABASE_URL` (direct Postgres, not PgBouncer).
3. Deploy the new build.
4. Sign in as a listed super admin and verify `/super`.
5. Create/verify the first institute and its admin.
6. Check RLS with a non-superuser application role: an institute must never see another
   institute's tests, students, results, materials or payments.

## 10. Smoke checklist

- [ ] `/super/login` → `/super` works for a super admin; other users are redirected.
- [ ] Create institute → appears in `/super/institutes` and `/i/[slug]`.
- [ ] Create institute admin → password sign-in works; `/admin` shows the institute name.
- [ ] Disable `online_tests` → it disappears from nav; `/app/tests` and `/admin/tests` return 403.
- [ ] Student Google sign-in attaches to the right institute; `/join` works for unattached users.
- [ ] Student cannot open another institute's test/material URL (RLS returns no row).
- [ ] Suspended institute/membership ends the session instead of showing tenant data.
- [ ] `bun run check` and `bun run build` pass.
