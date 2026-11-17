# EduSphere — multi-tenant coaching institute platform

SvelteKit 5 + Postgres (Supabase) + Bun. Institutes get their own tests, students and results;
students join with an institute code and can study at more than one coaching (each institute's
data stays separate). Payments happen on the institute's external payment page — there is no
in-app checkout.

## Deploy to Render

1. Push/merge this repo (done via GitHub).
2. Render → **New + → Blueprint** → pick the repo. The included `render.yaml` creates a Docker web service.
3. Fill the env vars it asks for (see table below).
4. Deploy. Migrations run automatically at every boot (`bun scripts/migrate.ts`) — the database is created/updated safely, no demo data is ever seeded.

### Environment variables

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase **session pooler**: `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require` |
| `MIGRATION_DATABASE_URL` | Same value (session pooler keeps session-level locks working) |
| `ORIGIN` | The public Render URL, e.g. `https://edusphere.onrender.com` (server refuses to boot without it) |
| `AUTH_SECRET` | `openssl rand -base64 32` (Blueprint generates one automatically) |
| `ADMIN_EMAILS` | Your Gmail — the first Google sign-in from this list becomes platform super admin |
| `GEMINI_API_KEY` | Google AI Studio key (AI question generator; optional) |
| `GEMINI_MODEL` | `gemini-3-flash-preview` |
| `ENABLE_ONLINE_CHECKOUT` | `false` — keep off; payments are external |

### First steps after the first deploy

1. Sign in on the app with a Gmail listed in `ADMIN_EMAILS` → you become the platform super admin (`/super`).
2. Super admin → Institutes → create your institute. Its unique **institute code** is shown on the admin dashboard (copy + share link there).
3. Share the code with students: they sign up (`/signup`), land on their dashboard, paste the code, and are added automatically. Students can join several institutes — each shows as its own button on their dashboard.

### Notes

- Postgres runs on Supabase (hosted). The app role should be RLS-safe (`NOBYPASSRLS`); see `drizzle/0009_multitenant.sql` for the tenant model.
- File uploads (notes/PDF) need Cloudflare R2 (`R2_*` vars) or a mounted disk; without storage configured, uploads stay disabled.
- Google sign-in is optional (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`); email + password works everywhere.
- Push notifications need VAPID keys (web) or a Firebase service account (Android); both optional.

## Local development

```sh
bun install
docker compose -f compose.local.yaml up -d --wait   # local Postgres on :5436
cp .env.example .env                                # fill in values
bun run db:migrate
bun run dev
```
