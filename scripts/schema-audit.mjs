#!/usr/bin/env node
/**
 * Schema-vs-code audit.
 *
 * Statically extracts every SQL statement passed to db.prepare(...) in the
 * CRM source, translates it exactly like src/lib/crm/db.ts does, replaces
 * placeholders with NULL (planning-safe for every query shape used here),
 * and runs EXPLAIN against the live database.
 *
 * Catches: missing columns (42703), missing tables (42P01), missing
 * functions (42883), type mismatches (42804) — i.e. every error the app
 * would only reveal at runtime.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const ROOTS = ['src/app/crm', 'src/lib/crm'];
const EXT = ['.ts', '.tsx'];

const NOW_TEXT = "to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')";

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (EXT.some(e => name.endsWith(e))) out.push(p);
  }
  return out;
}

/** Extract the SQL strings from every db.prepare( call in a source file. */
function extractQueries(src) {
  const queries = [];
  const re = /db\.prepare\(\s*(`(?:[^`\\]|\\.`|\\\${)*`|'(?:[^'\\]|\\')*')/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const raw = m[1].slice(1, -1); // strip quote chars
    // Interpolations in these codebases are only placeholders or the shared
    // NOW fragment — replace each with a placeholder marker.
    queries.push({ sql: raw, at: m.index });
  }
  return queries;
}

/** Mirror of the translation in src/lib/crm/db.ts + placeholder → NULL. */
function translate(query) {
  let out = '';
  let inString = false;
  for (let i = 0; i < query.length; i++) {
    const ch = query[i];
    if (inString) {
      out += ch;
      if (ch === "'") {
        if (query[i + 1] === "'") { out += "'"; i++; } else inString = false;
      }
      continue;
    }
    if (ch === "'") { inString = true; out += ch; continue; }
    if (ch === '?') { out += 'NULL'; continue; }
    out += ch;
  }
  return out
    .replace(/\$\{/g, 'NULL') // uninterpolated ${...} leftovers (e.g. JOIN(',') placeholders)
    .replace(/\bLIKE\b/g, 'ILIKE')
    .replace(/datetime\(\s*(["'])now\1\s*\)/gi, NOW_TEXT)
    .replace(/GROUP BY ROLLUP\s*\((.*?)\)/gis, 'GROUP BY $1');
}

function* readStatements(sql) {
  const files = ROOTS.flatMap(r => walk(r));
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    for (const q of extractQueries(src)) {
      yield { file, sql: translate(q.sql) };
    }
  }
}

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!url) { console.error('✗ DATABASE_URL is not set'); process.exit(1); }
const sql = postgres(url, { prepare: false, max: 1 });

let ok = 0;
const failures = [];
for (const stmt of readStatements(sql)) {
  try {
    await sql.unsafe(`EXPLAIN ${stmt.sql}`);
    ok++;
  } catch (err) {
    failures.push({ file: stmt.file, code: err.code, message: err.message, sql: stmt.sql });
  }
}

console.log(`✓ ${ok} statements plan cleanly against the live database`);
if (failures.length) {
  console.log(`\n✗ ${failures.length} statements FAILED:\n`);
  const seen = new Set();
  for (const f of failures) {
    const key = `${f.code}:${f.message}`;
    const first = !seen.has(key);
    seen.add(key);
    console.log(`[${f.code}] ${f.message}`);
    console.log(`   at ${f.file}`);
    console.log(`   ${f.sql.trim().split('\n')[0].slice(0, 140)}\n`);
    if (!first) continue;
  }
  const byCode = {};
  for (const f of failures) byCode[f.code] = (byCode[f.code] || 0) + 1;
  console.log('By code:', JSON.stringify(byCode));
  process.exitCode = 1;
}
await sql.end({ timeout: 5 });
