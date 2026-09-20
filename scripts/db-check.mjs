#!/usr/bin/env node
/**
 * Verifies the CRM's Supabase PostgreSQL connection and schema.
 *
 *   node scripts/db-check.mjs
 *
 * Exits 0 when DATABASE_URL is reachable and all CRM tables exist.
 */
import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!url) {
  console.error(
    '✗ DATABASE_URL is not set.\n' +
      '  Add it to .env.local (Supabase Dashboard → Project Settings → Database → Connection string → URI).'
  );
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });

const EXPECTED_TABLES = [
  'users', 'sessions', 'customers', 'trips', 'quotations', 'quotation_items',
  'payments', 'followups', 'tasks', 'activities', 'communications',
  'documents', 'itinerary_days', 'hotels', 'suppliers', 'drivers', 'audit_logs',
];

try {
  const [{ now, version }] = await sql`SELECT now()::text as now, version() as version`;
  console.log(`✓ Connected — Postgres ${version.split(' ').slice(0, 2).join(' ')} (server time ${now})`);

  const tables = await sql`
    SELECT c.relname AS name,
           (SELECT COUNT(*) FROM information_schema.columns col
             WHERE col.table_schema = 'public' AND col.table_name = c.relname) AS columns,
           c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `;

  const names = tables.map(t => t.name);
  const missing = EXPECTED_TABLES.filter(t => !names.includes(t));

  if (missing.length) {
    console.error(`✗ Missing tables: ${missing.join(', ')}`);
    console.error('  Run supabase/migrations/001_initial_schema.sql (and 002_seed_data.sql) in the Supabase SQL Editor.');
    process.exitCode = 1;
  } else {
    console.log(`✓ All ${EXPECTED_TABLES.length} CRM tables present (RLS: ${tables.filter(t => t.rls).length}/${tables.length} enabled)`);
  }

  for (const t of ['users', 'customers', 'trips', 'quotations', 'payments']) {
    if (!names.includes(t)) continue;
    const [{ count }] = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM "${t}"`);
    console.log(`  ${t}: ${count} row${count === 1 ? '' : 's'}`);
  }
} catch (err) {
  console.error(`✗ Connection failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
