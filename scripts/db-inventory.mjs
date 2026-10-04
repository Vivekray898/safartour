#!/usr/bin/env node
/**
 * Read-only inventory of the live Supabase database.
 *
 * Uses the REST API with the SECRET key so it can see everything, and only
 * ever issues SELECTs. Nothing is written.
 *
 *   node --env-file=.env.local scripts/db-inventory.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !secretKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
  process.exit(1)
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Use PostgREST's OpenAPI description to enumerate the schema. Far more
// reliable than guessing table names.
const res = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
})
const spec = await res.json()

const tables = Object.keys(spec.paths || {})
  .map((p) => p.replace(/^\//, ''))
  .filter((t) => t && !t.includes('?'))

console.log(`Project: ${url.replace('https://', '')}`)
console.log(`Tables visible via PostgREST: ${tables.length}\n`)

let total = 0
const rows = []
for (const t of tables.sort()) {
  const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true })
  if (error) {
    rows.push([t, `error: ${error.message}`])
    continue
  }
  total += count || 0
  rows.push([t, count])
}

const w = Math.max(...rows.map((r) => r[0].length))
console.log('TABLE'.padEnd(w) + '  ROWS')
for (const [t, c] of rows) {
  console.log(t.padEnd(w) + '  ' + c)
}
console.log('\nTOTAL ROWS: ' + total)

// Does the anon key see anything? This is the Phase 1 security gate.
if (publishableKey) {
  console.log('\n--- anon (publishable) key visibility — Phase 1 gate ---')
  const anon = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  for (const t of ['trips', 'customers', 'users', 'sessions', 'quotations']) {
    if (!tables.includes(t)) {
      console.log(`  ${t.padEnd(w)}  (table does not exist)`)
      continue
    }
    const { data, error } = await anon.from(t).select('*').limit(5)
    const n = error ? `blocked (${error.code || error.message})` : (data?.length ?? 0)
    console.log(`  ${t.padEnd(w)}  rows returned: ${n}`)
  }
}