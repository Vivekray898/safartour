# SafarTour recovery plan

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

**Recovery posture:** stop at identification and evidence preservation until the
owner confirms the database and backup source. No migration, test lead, data write,
or destructive recovery action was performed during this audit.

## Known state

- The application expects Supabase PostgreSQL through `DATABASE_URL` or
  `SUPABASE_DB_URL` (`src/lib/crm/db.ts:42-55`).
- `node --env-file=.env.local scripts/db-check.mjs` currently fails at DNS and
  returns no table/row evidence.
- `scripts/schema-audit.mjs` cannot provide a live EXPLAIN result while that
  dependency is unavailable.
- The repository contains migrations and demo seed data, but no verified production
  backup, export, restore artifact, or row-count snapshot.
- Public leads are intended to go to Google Sheets, optional Resend, or logs through
  `src/app/api/leads/route.ts:76-169`; the current code does not write them to CRM.
- Files uploaded by the current document handler are local files, so their recovery
  is separate from the database (`src/app/crm/api/documents/upload/route.ts:42-64`).

## Recovery gates

| Gate | Owner decision/evidence required | Do not proceed until |
| --- | --- | --- |
| G1: database identity | Confirm the intended Supabase project/host and whether the current reference is wrong, paused, renamed, or deleted | A reachable, owner-approved target exists |
| G2: data authority | Identify whether leads/customers live in a backup, Sheet export, another project, logs, or nowhere recoverable | Source and retention authority are documented |
| G3: backup | Take a provider backup or approved database dump before writes | Backup artifact is retained and restorable |
| G4: production freeze | Confirm no concurrent operator is editing the source during export/import | Cutover window and owner contact are recorded |
| G5: secret rotation | Replace any default credentials and rotate exposed connection/API credentials | New values are stored only in the deployment secret manager |
| G6: acceptance | Owner signs off row counts, sample records, access rules, and lead routing | Production traffic is enabled |

## Recovery sequence

### Phase 0 — Preserve evidence

1. Preserve the current `main` checkout, lockfile, migrations, existing docs, and
   ignored environment file without copying secret values into tickets or reports.
2. Record the failed `db-check` output, deployment URL/configuration owner, and the
   date/time of the incident.
3. Do not run the seed migration against an unknown project and do not submit a
   live Sheet test row without explicit approval.

### Phase 1 — Identify and export

1. Compare the deployment's configured database host with the owner-approved
   Supabase dashboard/project list.
2. If the original project is reachable, take a backup and perform read-only
   inventory: server version, migration history, tables, columns, RLS, policies,
   row counts, recent timestamps, and storage objects.
3. If the original project is unavailable, export the authoritative Sheets tabs and
   preserve the original columns/timestamps. Collect approved email/log exports and
   any provider backups. Never infer missing CRM rows from demo seed data.
4. Hash and retain each export with source, timestamp, owner, and format metadata.

### Phase 2 — Restore into an isolated target

1. Create or select an owner-approved Supabase project in the intended region.
2. Apply migrations in order only after reviewing them against the target; reconcile
   the stale setup docs and the `company_settings` check before use.
3. Do not load the demo credential seed into production. Create a one-time admin
   through an owner-controlled path and rotate all related secrets.
4. Import recovered records through an idempotent, dry-run-first importer. Preserve
   source IDs/references and record every rejected or ambiguous row.
5. Restore documents into private durable storage, or explicitly report them as
   unavailable if only local ephemeral files existed.

### Phase 3 — Validate and cut over

1. Run `scripts/db-check.mjs` and a completed read-only schema audit.
2. Run authenticated route/workflow tests with disposable or approved test records.
3. Confirm anonymous access cannot read CRM rows, employee/admin boundaries work,
   and document URLs are authorized/expiring.
4. Switch the app secret configuration during the approved window, monitor lead
   intake, login failures, database errors, and storage failures.
5. Keep the old backup/export read-only until the owner confirms reconciliation and
   rollback expiry.

## Proposed service objectives

RPO and RTO values are **owner inputs**, not measured commitments. Before cutover,
approve a maximum acceptable lead-data loss window, CRM restoration window, document
retention period, and rollback window. Record the chosen values with the backup
schedule and alert thresholds.

## Acceptance criteria

- The owner can name the authoritative database and lead source, with a retained
  backup and a tested restore.
- Recovered customer, lead, quotation, payment, task, follow-up, and activity counts
  reconcile to the source; every exception is explained.
- No seed/demo credential is active in the recovered production environment.
- The application passes build, DB check, schema audit, authenticated route smoke,
  and lead-failure/fallback tests against the recovered target.
- A second operator can follow the recovery runbook without access to this machine's
  ignored environment file or undocumented credentials.
