#!/usr/bin/env node
/**
 * Static sanity check for the Phase 1 migrations.
 *
 * These cannot be executed until a live Supabase project exists, so this
 * catches the class of mistake that would otherwise only surface at apply
 * time: referencing a table that migrations 001-004 never declared, or an
 * unbalanced dollar-quote / DO block.
 *
 *   node scripts/phase1-sql-check.mjs
 *
 * Read-only. Exits non-zero on any finding.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS = 'supabase/migrations'

// Tables the earlier migrations declare.
const declared = new Set()
for (const f of readdirSync(MIGRATIONS).filter((f) => /^00[1-4]_/.test(f))) {
  const sql = readFileSync(join(MIGRATIONS, f), 'utf8')
  for (const m of sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)/gi)) {
    declared.add(m[1].toLowerCase())
  }
}

// Tables Supabase manages for us; not created by our migrations.
const managed = new Set(['storage.buckets', 'storage.objects', 'auth.users'])

// Tables this phase creates itself.
const selfCreated = new Set(['profiles'])

let problems = 0

for (const f of ['005_auth_profiles_rls.sql', '006_storage_and_seed_cleanup.sql']) {
  const sql = readFileSync(join(MIGRATIONS, f), 'utf8')

  const refs = new Set()
  const patterns = [
    /ALTER TABLE\s+([a-z_]+\.[a-z_]+|[a-z_]\w*)/gi,
    /CREATE TABLE IF NOT EXISTS\s+([a-z_]+\.[a-z_]+|[a-z_]\w*)/gi,
    /(?:DROP POLICY IF EXISTS|CREATE POLICY)\s+"[^"]+"\s+ON\s+([a-z_]+\.[a-z_]+|[a-z_]\w*)/gi,
    /\bFROM\s+([a-z_]+\.[a-z_]+|[a-z_]\w*)/gi,
    /\bINSERT INTO\s+([a-z_]+\.[a-z_]+|[a-z_]\w*)/gi,
    /\bUPDATE\s+([a-z_]+\.[a-z_]+|[a-z_]\w*)\s+SET/gi,
  ]
  for (const re of patterns) {
    for (const m of sql.matchAll(re)) {
      // `public.profiles` and `profiles` are the same table; normalise the
      // schema qualifier so a qualified reference is not a false positive.
      refs.add(m[1].toLowerCase().replace(/^public\./, ''))
    }
  }

  const unknown = [...refs]
    .filter((r) => !declared.has(r) && !managed.has(r) && !selfCreated.has(r))
    .sort()

  // Balance checks.
  const dollars = (sql.match(/\$\$/g) || []).length
  const dollarsOk = dollars % 2 === 0
  const doOpen = (sql.match(/\bDO \$\$/gi) || []).length
  const endBlock = (sql.match(/END \$\$;/gi) || []).length
  // Count the loop opener as FOREACH ... LOOP. A bare \bLOOP\b also matches
  // the END LOOP that closes it, which double-counted and produced a false
  // "unbalanced" verdict.
  const loopOpen = (sql.match(/\bFOREACH\b[\s\S]*?\bLOOP\b/gi) || []).length
  const loopEnd = (sql.match(/\bEND LOOP;/gi) || []).length

  console.log(`\n=== ${f} ===`)
  console.log(`  tables referenced (${refs.size}): ${[...refs].sort().join(', ')}`)
  console.log(`  unknown tables: ${unknown.length ? unknown.join(', ') : '(none)'}`)
  console.log(`  $$ delimiters: ${dollars} ${dollarsOk ? 'balanced' : 'UNBALANCED'}`)
  console.log(`  DO $$ blocks: ${doOpen}, closed by END $$;: ${endBlock}`)
  console.log(`  LOOP open/close: ${loopOpen}/${loopEnd}`)

  if (unknown.length) problems++
  if (!dollarsOk) problems++
  if (doOpen !== endBlock) problems++
  if (loopOpen !== loopEnd) problems++
}

console.log(
  problems === 0
    ? '\nOK — every referenced table exists and every block is balanced.'
    : `\n${problems} problem(s) found.`,
)
process.exit(problems === 0 ? 0 : 1)