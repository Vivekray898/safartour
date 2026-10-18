# SafarTour Supabase audit

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

**Important limitation:** live inspection is available through the linked Supabase
CLI Management API, but it is not the same connection path used by the Next.js
application. Backup/restore status and the complete remote migration history remain
unverified.

## Live linked-project evidence (2026-10-18)

The linked Supabase CLI project was reachable through `supabase db query --linked`.
This is separate from the application's `DATABASE_URL`, which still fails DNS
resolution locally. The linked project reported PostgreSQL 17.6 and the following
read-only findings:

- 19 public tables were present, including `profiles`; all reported RLS enabled.
- Row counts included 2 legacy `users`, 20 `sessions`, 15 `customers`, 13
  `trips`, 15 `quotations`, 122 `activities`, 11 `followups`, 10 `tasks`, and
  0 `profiles`, `documents`, `communications`, `itinerary_days`, and `audit_logs`.
- `auth.users` contained 0 rows and `storage.buckets` contained 0 rows.
- The live database has the Auth/RLS foundation shape (`profiles`, UUID assignment
  columns, role helper functions, and policies), but private document Storage is
  not present.
- The live `profiles` update policy allowed a user to update their own `role` and
  `active` values. Migration `008_harden_profile_updates.sql` narrows that policy;
  applying it is a live write and is not claimed here until verified.
- `supabase_migrations.schema_migrations` was absent, so the remote migration
  history cannot be trusted as a record of which SQL files were applied.
- `008_harden_profile_updates.sql` was applied through the linked Supabase query
  path and verified by reading the function and profile policy definitions.
- `009_public_lead_intake.sql` was applied through the linked Supabase query path.
  Its RPC is executable by `service_role` only; a publishable-key request returned
  HTTP 401. One synthetic lead was submitted through the local `/api/leads` route,
  verified in CRM as `ST-2026-00014`, replayed with the same idempotency key
  (`duplicate: true`), and then fully removed in a targeted transaction. The
  live receipt/trip/customer counts returned to their pre-test values.

A private data snapshot was saved outside the repository before any write. Its
  location and digest are intentionally not recorded in git or project docs.

## Current database architecture

```text
CRM server components / route handlers
  -> src/lib/crm/db.ts (postgres driver + SQLite-shaped wrapper)
  -> DATABASE_URL or SUPABASE_DB_URL
  -> Supabase PostgreSQL (intended dependency)
```

`src/lib/crm/db.ts:42-76,145-215` creates a server-side `postgres` client with
`prepare: false`, translates `?` placeholders, and executes parameter arrays through
the driver. It preserves text dates and integer flags for existing UI semantics.

## Migration inventory

| File | Static purpose | Evidence |
| --- | --- | --- |
| `supabase/migrations/001_initial_schema.sql` | Core CRM tables, foreign keys, indexes, RLS enablement | Tables and indexes at lines 17-374; RLS at lines 376-398 |
| `supabase/migrations/002_seed_data.sql` | Disabled placeholder users and CRM rows | Inserts at lines 13-127; seed users are disabled until owner-controlled provisioning |
| `supabase/migrations/003_trips_archived.sql` | `trips.archived` soft-delete column/index/check | Lines 15-31 |
| `supabase/migrations/004_crm_quality.sql` | `company_settings`, quotation tax snapshot, catalog archive columns/indexes | Lines 12-68 |
| `supabase/migrations/005_auth_profiles_rls.sql` | Auth profiles, UUID assignment columns, role helpers, and CRM RLS | Historical foundation, also observed in the linked live schema |
| `supabase/migrations/006_storage_and_seed_cleanup.sql` | Private document bucket and Storage RLS policies | Present locally; not applied to the linked project; no bucket exists live |
| `supabase/migrations/007_disable_demo_credentials.sql` | Narrow cleanup for already-seeded demo credentials | Applied to the linked project; both known seed accounts are inactive and use the disabled marker |
| `supabase/migrations/008_harden_profile_updates.sql` | Prevent staff self-promotion through profile updates | Applied and verified on the linked project |
| `supabase/migrations/009_public_lead_intake.sql` | Atomic CRM-first public lead RPC and idempotency receipts | Applied, permission-checked, and exercised with a cleaned-up synthetic lead |

The migrations statically declare 18 tables: 17 core tables in migration 001 plus
`company_settings` in migration 004. The set includes users, sessions, customers,
trips, quotations, quotation items, payments, follow-ups, tasks, activities,
communications, documents, itinerary days, suppliers, hotels, drivers, audit logs,
and company settings.

## RLS and authorization posture

- Migration 001 enables RLS on its CRM tables (`001_initial_schema.sql:376-398`).
- Migration 001 does not define table policies for those tables. Migration 004 adds
  a deny policy only for `company_settings` (`004_crm_quality.sql:52-56`).
- The migration comments describe a privileged server connection and application-
  level session/role checks (`001_initial_schema.sql:11-15,376-381`).
- The application uses a custom `crm_session` cookie and custom role functions
  (`src/lib/crm/auth.ts:6-8,41-59,97-120`).
- `canViewCustomer`, `canViewQuotation`, `canViewFollowUp`, and `canViewTask` return
  `true` for any session (`src/lib/crm/permissions.ts:22-24,34-36,58-60,71-73`).
  This is a source-level authorization design risk; it is not a live policy test.

## Live connectivity result

The current no-write command `node --env-file=.env.local scripts/db-check.mjs`
failed with DNS `ENOTFOUND`. It did not return Postgres version, table names, RLS
state, or row counts. The EXPLAIN-oriented `scripts/schema-audit.mjs` did not
produce a result within 30 seconds. No migration was applied and no live data was
read or changed during this audit.

The configured project identity, actual data location, backup availability, and
whether the failure is deletion, rename, wrong reference, pause, or local
configuration error are **unverified** and require owner/provider confirmation.

## Static consistency findings

1. The setup docs now point to `supabase/migrations/001_...` through `005_...` and
   provision the first user through `pnpm crm:user`; applying migration 007 still
   requires an owner-approved target and backup.
2. `scripts/db-check.mjs:23-27` has an expected-table list that omits
   `company_settings`, although migration 004 creates it and settings code reads it.
3. `src/lib/crm/storage.ts:9-18,45-78` now prefers the current
   `SUPABASE_SECRET_KEY` name, with the legacy service-role name retained only as
   a compatibility fallback. It still uses a public `crm-logos` bucket, and the
   live project currently has no buckets; private document storage remains a
   separate unfinished migration.
4. Documents are recorded in Postgres but the current file bytes are written to
   `process.cwd()/crm-documents` (`src/app/crm/api/documents/upload/route.ts:42-64`),
   which is not a durable multi-instance database/storage design.
5. The static schema diff reported `audit_logs` columns as unused. Direct source
   search also found activity logging but no writer for `audit_logs`; this means an
   application activity timeline exists, while a dedicated audit-log trail is not
   demonstrated by current code.

The output of `scripts/phase0-schema-diff.mjs` also included alias-derived column
false positives. Its clean table-name result is useful; its column list must not be
treated as a live schema verdict.

## Current versus target database architecture

| Current on `main` | Proposed target, not implemented |
| --- | --- |
| Custom bcrypt/session tables and a privileged `DATABASE_URL` path | A deliberate auth/session design with rotated/revocable sessions and least-privilege DB access |
| RLS enabled statically but mostly policy-free | Explicit RLS policies tested for anonymous, employee, and admin cases |
| `customers` represents contacts; `trips` represents leads; no separate bookings table | Owner-approved naming/data model, with a tested booking representation |
| Text dates and integer booleans retained for compatibility | Preserve types during recovery; revisit only through a separate migration and full regression test |
| Local document files and public logo bucket | Private durable storage, scoped object paths, signed short-lived URLs |
| Sheets is the public lead primary path | Supabase durable intake first, idempotency/rate limit, then optional Sheets mirror |

The target choices above are **proposed**. Historical decisions in
`docs/DECISIONS.md` are recorded as branch-era planning evidence, not proof that
those changes landed on current `main`.

## Owner and live-environment blockers

- Identify the correct Supabase project and confirm whether historical rows survive.
- Identify the authoritative lead source: database backup, Google Sheet export,
  deployment logs, or another approved system.
- Take and retain a backup before applying any migration or importer.
- Confirm the canonical production domain and deployment environment variables.
- Approve whether a test lead may be submitted to the live Sheet; no such write was
  made during this audit.

## Acceptance criteria

- `scripts/db-check.mjs` passes against the owner-approved project and checks all 18
  current tables, including `company_settings`, with expected RLS state.
- A read-only schema audit completes against the restored database with no missing
  table/column/function findings, or every exception is documented and approved.
- Anonymous Supabase API access returns no CRM rows; employee/admin policy tests
  demonstrate the intended record boundaries.
- A backup artifact, restore test, migration order, and row reconciliation report
  exist before production writes.
- Documents survive a fresh application instance and are retrievable only through
  authorized, expiring access.
