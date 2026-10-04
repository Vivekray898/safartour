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

/**
 * Collision check: `ADD COLUMN IF NOT EXISTS` SILENTLY does nothing when a
 * column of that name already exists — with whatever type it already had.
 * If an earlier migration declared `tasks.assigned_to INTEGER` and we try to
 * add it as `uuid`, the ALTER is a no-op and the column stays integer, so a
 * policy comparing it to `auth.uid()` dies with
 *     42883: operator does not exist: integer = uuid
 * This walks every ADD COLUMN in 005/006 against the schema 001-004
 * declares and fails loudly on the clash.
 */
const existingCols = new Map() // "table.column" -> type
for (const f of readdirSync(MIGRATIONS).filter((f) => /^00[1-4]_/.test(f))) {
  const sql = readFileSync(join(MIGRATIONS, f), 'utf8')
  for (const m of sql.matchAll(
    /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\);/gi,
  )) {
    const [, table, body] = m
    for (const rawLine of body.split('\n')) {
      const line = rawLine.replace(/--.*$/, '').trim()
      const c = line.match(
        /^(\w+)\s+(TEXT|INTEGER|SERIAL|BIGINT|NUMERIC|BOOLEAN|DATE|TIMESTAMPTZ|JSONB|BYTEA|uuid|UUID)\b/i,
      )
      if (c) existingCols.set(`${table.toLowerCase()}.${c[1].toLowerCase()}`, c[2].toLowerCase())
    }
  }
  // ALTER TABLE ... ADD COLUMN IF NOT EXISTS in the earlier migrations too
  for (const m of sql.matchAll(
    /ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)\s+(\w+)/gi,
  )) {
    existingCols.set(
      `${m[1].toLowerCase()}.${m[2].toLowerCase()}`,
      m[3].toLowerCase(),
    )
  }
}

for (const f of ['005_auth_profiles_rls.sql', '006_storage_and_seed_cleanup.sql']) {
  const raw = readFileSync(join(MIGRATIONS, f), 'utf8')
  // Strip `--` comments before scanning. Prose inside a comment that happens
  // to look like SQL (e.g. "ADD COLUMN IF NOT EXISTS assigned_to uuid" quoted
  // in an explanatory note) was being parsed as a real statement.
  const sql = raw
    .split('\n')
    .map((line) => (line.trim().startsWith('--') ? '' : line))
    .join('\n')

  // Tables this file creates itself (e.g. `profiles`) are not in 001-004, so
  // fold them in before type checking. Without this, `profiles.id` looks
  // unknown and the checker falsely matches it against `users.id` (serial).
  const cols = new Map(existingCols)
  for (const m of sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
    const [, table, body] = m
    for (const rawLine of body.split('\n')) {
      const line = rawLine.replace(/--.*$/, '').trim()
      const c = line.match(
        /^(\w+)\s+(TEXT|INTEGER|SERIAL|BIGINT|NUMERIC|BOOLEAN|DATE|TIMESTAMPTZ|JSONB|BYTEA|uuid|UUID)\b/i,
      )
      if (c) cols.set(`${table.toLowerCase()}.${c[1].toLowerCase()}`, c[2].toLowerCase())
    }
  }
  // And this file's own ADD COLUMNs.
  for (const m of sql.matchAll(
    /ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)\s+(uuid|text|integer|bigint|boolean|timestamptz|jsonb|date|numeric)\b/gi,
  )) {
    cols.set(`${m[1].toLowerCase()}.${m[2].toLowerCase()}`, m[3].toLowerCase())
  }

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

  // ADD COLUMN type clashes: an existing integer column would make the uuid
  // ALTER a silent no-op, and the policy would then compare integer = uuid.
  const clashes = []
  for (const m of sql.matchAll(
    /ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)\s+(uuid|text|integer|bigint|boolean|timestamptz|jsonb|date|numeric)\b/gi,
  )) {
    const key = `${m[1].toLowerCase()}.${m[2].toLowerCase()}`
    const want = m[3].toLowerCase()
    const have = existingCols.get(key)
    if (have && have !== want) {
      clashes.push(
        `${key}: already ${have}, ADD COLUMN ${want} would be a silent no-op`,
      )
    }
  }

  console.log(`\n=== ${f} ===`)
  console.log(`  tables referenced (${refs.size}): ${[...refs].sort().join(', ')}`)
  console.log(`  unknown tables: ${unknown.length ? unknown.join(', ') : '(none)'}`)
  console.log(`  $$ delimiters: ${dollars} ${dollarsOk ? 'balanced' : 'UNBALANCED'}`)
  console.log(`  DO $$ blocks: ${doOpen}, closed by END $$;: ${endBlock}`)
  console.log(`  LOOP open/close: ${loopOpen}/${loopEnd}`)
  console.log(`  ADD COLUMN clashes: ${clashes.length ? clashes.join('; ') : '(none)'}`)

  // auth.uid() is uuid. Any column compared with it MUST be uuid too,
  // otherwise Postgres raises 42883 "operator does not exist: integer = uuid".
  // Two separate bugs shipped this way: tasks.assigned_to (an existing INTEGER
  // column) and drivers.id (SERIAL). This check makes both impossible.
  const uidClashes = []
  // Set of known table names, so `ON drivers` is recognised as a table context.
  const knownTables = new Set([...cols.keys()].map((k) => k.split('.')[0]))
  // Track the table each policy belongs to: `... ON <table>` starts a policy,
  // and `FROM <table> <alias>` sets the alias for a subquery comparison.
  let currentTable = null
  let aliasTable = null
  const lines = sql.split('\n')
  for (const ln of lines) {
    const onT = ln.match(/\bON\s+([a-z_]\w*)\s*(?:FOR|$|\s)/i)
    if (onT && knownTables.has(onT[1].toLowerCase())) currentTable = onT[1].toLowerCase()
    const al = ln.match(/\bFROM\s+([a-z_]\w*)\s+([a-z])\b/i)
    if (al && knownTables.has(al[1].toLowerCase())) aliasTable = al[1].toLowerCase()

    for (const m of ln.matchAll(/(\b([a-z])\.)?\b(\w+)\s*=\s*auth\.uid\(\)/gi)) {
      const alias = m[2] ? m[2].toLowerCase() : null
      const col = (m[3] || '').toLowerCase()
      if (!col || col === 'auth') continue
      const table = alias ? aliasTable : currentTable
      if (!table) continue
      const type = cols.get(table + '.' + col)
      if (type && type !== 'uuid') {
        uidClashes.push(
          `${table}.${col} is ${type}, not uuid — comparing it to auth.uid() raises 42883`,
        )
      }
    }
  }

  if (unknown.length) problems++
  if (!dollarsOk) problems++
  if (doOpen !== endBlock) problems++
  if (loopOpen !== loopEnd) problems++
  if (clashes.length) problems++
  console.log(`  auth.uid() type clashes: ${uidClashes.length ? uidClashes.join('; ') : '(none)'}`)
  if (uidClashes.length) problems++
}

console.log(
  problems === 0
    ? '\nOK — every referenced table exists and every block is balanced.'
    : `\n${problems} problem(s) found.`,
)
process.exit(problems === 0 ? 0 : 1)