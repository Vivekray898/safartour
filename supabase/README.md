# Supabase PostgreSQL setup for the CRM

The CRM persists all data in **Supabase's hosted PostgreSQL**. There is no
local database server and no SQLite/MySQL dependency anywhere in the project.

## 1. Create the Supabase project

1. Create (or open) a project at https://supabase.com.
2. Go to **Project Settings → Database → Connection string → URI**.
3. Copy the URI (use the "Session pooler" URI, or the direct connection URI).
   Replace `[YOUR-PASSWORD]` with the database password you chose.

## 2. Create the tables and seed data

In the Supabase Dashboard open **SQL Editor** and run the migrations in numeric
order, `001` through `009`. The important stages are:

- `001`–`004`: legacy-compatible CRM tables and quality columns.
- `005`: Supabase Auth profiles, role helpers, assignment columns, and RLS.
- `006`: private CRM document Storage bucket and policies.
- `007`: disable the known seeded legacy accounts on an existing database.
- `008`: prevent staff profile self-promotion.
- `009`: atomic, service-role-only public lead intake and idempotency receipts.

`002_seed_data.sql` creates demo rows with disabled placeholder users; it does
not publish or enable a default password. Review `007` against the owner-approved
database before applying it because it deactivates two known seed addresses.

After the migrations, provision the first account from a machine that has database access:

   ```bash
   CRM_BOOTSTRAP_PASSWORD='use-a-new-password' \
     pnpm crm:user -- admin@example.com 'Admin User' admin
   ```

   The password is read from the environment and is never printed. Use the
   `employee` role for a non-admin account. Never commit the bootstrap password.

## 3. Configure the app

Add the connection string to `.env.local` (never commit it):

```env
SUPABASE_DB_URL=postgresql://postgres.<ref>:YOUR-PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
# DATABASE_URL may remain configured as a fallback for maintenance tools.
```

The key is server-only (no `NEXT_PUBLIC_` prefix), so it is never exposed to
the browser. See `.env.example` for the full list of variables.

## 4. Verify

```bash
node --env-file=.env.local scripts/db-check.mjs
```

should print the connection info and per-table row counts.

## Security model

- **RLS is enabled on every table** with no public policies: the anon /
  authenticated Supabase API (browser-facing keys) cannot read or write CRM
  data.
- The current Next.js server connects with the privileged role from
  `DATABASE_URL` and uses custom session cookies plus admin/employee roles.
  Record-level assignment enforcement is not complete on `main`; treat this as
  an interim architecture until the reviewed Supabase Auth/RLS migration lands.
- `SUPABASE_SECRET_KEY` must stay server-only. It is used only by the public lead
  RPC and controlled server-side Storage operations.
