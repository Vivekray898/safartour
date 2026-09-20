# Supabase PostgreSQL setup for the CRM

The CRM persists all data in **Supabase's hosted PostgreSQL**. There is no
local database server and no SQLite/MySQL dependency anywhere in the project.

## 1. Create the Supabase project

1. Create (or open) a project at https://supabase.com.
2. Go to **Project Settings → Database → Connection string → URI**.
3. Copy the URI (use the "Session pooler" URI, or the direct connection URI).
   Replace `[YOUR-PASSWORD]` with the database password you chose.

## 2. Create the tables and seed data

In the Supabase Dashboard open **SQL Editor** and run, in order:

1. `supabase/schema.sql` — creates all CRM tables, indexes and Row Level
   Security policies.
2. `supabase/seed.sql` — seeds the default users and demo data:

   | email                 | password   | role     |
   |-----------------------|------------|----------|
   | `admin@safartour.crm` | `admin123` | admin    |
   | `rajesh@safartour.crm`| `admin123` | employee |

   Change these passwords after the first login (Settings → Users in the CRM).

## 3. Configure the app

Add the connection string to `.env.local` (never commit it):

```env
DATABASE_URL=postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```

The key is server-only (no `NEXT_PUBLIC_` prefix), so it is never exposed to
the browser. See `.env.example` for the full list of variables.

## 4. Verify

```bash
node scripts/db-check.mjs
```

should print the connection info and per-table row counts.

## Security model

- **RLS is enabled on every table** with no public policies: the anon /
  authenticated Supabase API (browser-facing keys) cannot read or write CRM
  data.
- The Next.js server connects with the privileged role from `DATABASE_URL`
  and enforces the CRM's own auth (session cookies, admin/employee roles,
  record-level assignment rules) in `src/lib/crm/auth.ts` and
  `src/lib/crm/permissions.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` (if you later add supabase-js features such as
  Storage) must stay server-only as well.
