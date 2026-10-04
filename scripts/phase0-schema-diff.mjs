#!/usr/bin/env node
/**
 * Phase 0 static schema-vs-code diff.
 *
 * The live Supabase project referenced by .env.local does not resolve, so the
 * planned EXPLAIN-based `scripts/schema-audit.mjs` cannot run. This script
 * answers the same question statically: it parses the declared schema out of
 * supabase/migrations/*.sql, then scans every SQL string in the CRM source and
 * reports (a) columns the code reads/writes that the migrations never declare,
 * (b) declared columns the code never touches, (c) foreign keys and indexes.
 *
 *   node scripts/phase0-schema-diff.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/app/crm', 'src/lib/crm'];
const EXT = ['.ts', '.tsx'];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXT.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

// ---------- 1. declared schema ----------
const schema = {}; // table -> Set(column)
const order = [];
for (const f of readdirSync('supabase/migrations').sort()) {
  const sql = readFileSync(join('supabase/migrations', f), 'utf8');
  const re = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\);/g;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const [, table, body] = m;
    if (!schema[table]) {
      schema[table] = new Set();
      order.push(table);
    }
    for (const rawLine of body.split('\n')) {
      const line = rawLine.replace(/--.*$/, '').trim();
      if (!line) continue;
      const c = line.match(/^(\w+)\s+(TEXT|INTEGER|SERIAL|BIGINT|NUMERIC|BOOLEAN|DATE|TIMESTAMPTZ|JSONB|BYTEA)\b/i);
      if (c) schema[table].add(c[1]);
    }
  }
  // ALTER TABLE ... ADD COLUMN IF NOT EXISTS
  const are = /ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)/gi;
  while ((m = are.exec(sql)) !== null) {
    const [, table, col] = m;
    if (!schema[table]) {
      schema[table] = new Set();
      order.push(table);
    }
    schema[table].add(col);
  }
}

// ---------- 2. SQL strings in CRM code ----------
const used = new Map(); // table -> Set(column)
const allRefs = []; // {file, table, col}
const UNKNOWN_TABLES = new Set();

function addCol(table, col) {
  if (!used.has(table)) used.set(table, new Set());
  used.get(table).add(col);
  allRefs.push({ table, col });
}

const files = ROOTS.flatMap((r) => walk(r));
const sqlStrings = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const re = /db\.prepare\(\s*(`(?:[^`\\]|\\.|\$\{)*?`|'[^']*')/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    let q = m[1].slice(1, -1).replace(/\$\{[^}]*\}/g, '1');
    if (!/^\s*[`'](select|insert|update|delete)\b/i.test('`' + q.trim())) {
      if (!/^\s*(select|insert|update|delete)\b/i.test(q)) continue;
    }
    sqlStrings.push({ file, q });
  }
  // Also capture raw template SQL not wrapped in db.prepare (e.g. pdf.ts, activity.ts)
  const re2 = /sql\.unsafe\(\s*`([\s\S]*?)`/g;
  while ((m = re2.exec(src)) !== null) {
    sqlStrings.push({ file, q: m[1].replace(/\$\{[^}]*\}/g, '1') });
  }
}

const KW = new Set(['from','where','select','and','or','on','join','left','right','inner','outer','as','by','group','order','limit','offset','insert','into','values','update','set','delete','distinct','case','when','then','else','end','null','not','in','is','like','ilike','between','exists','all','any','asc','desc','union','having','count','sum','coalesce','max','min','now','to_char','interval','date','trunc','extract','round','cast','integer','text','true','false','default','returning','with','lateral','unnest','generate_series','current_date','current_timestamp','at','time','zone','substring','from_','over','partition']);

for (const { file, q } of sqlStrings) {
  const lower = q.toLowerCase();

  // INSERT INTO t (cols)
  const ins = lower.matchAll(/insert\s+into\s+(\w+)\s*\(([^)]*)\)/g);
  for (const mm of ins) {
    const t = mm[1];
    if (!schema[t]) UNKNOWN_TABLES.add(t);
    for (const c of mm[2].split(',').map((s) => s.trim().replace(/^\w+\./, ''))) {
      if (c && !KW.has(c)) addCol(t, c);
    }
  }

  // UPDATE t SET a=..., b=...
  const upd = lower.matchAll(/update\s+(\w+)\s+set\s+([\s\S]*?)(?:\s+where\b|\s+returning\b|$)/g);
  for (const mm of upd) {
    const t = mm[1];
    if (!schema[t]) UNKNOWN_TABLES.add(t);
    for (const part of mm[2].split(',')) {
      const c = part.trim().split(/\s*=\s*/)[0].trim().replace(/^\w+\./, '');
      if (c && !KW.has(c)) addCol(t, c);
    }
  }

  // column lists in SELECT before FROM
  for (const mm of lower.matchAll(/select\s+([\s\S]*?)\s+from\s+(\w+)/g)) {
    const list = mm[1];
    const table = mm[2];
    if (!schema[table]) continue;
    const explicit = /\s(as\s+\w+|\bas\b)/.test(list) || /[,\s]\w+\./.test(list);
    if (!explicit) continue;
    for (const part of list.split(',')) {
      const cleaned = part.trim().replace(/\s+as\s+\w+$/, '');
      const c = (cleaned.split('.').pop() || '').trim().replace(/[()]/g, '');
      if (/^\w+$/.test(c) && !KW.has(c)) addCol(table, c);
    }
  }

  // bare column comparisons in WHERE against single-table queries
  for (const mm of lower.matchAll(/\bfrom\s+(\w+)\b([\s\S]*)$/g)) {
    const table = mm[1];
    if (!schema[table]) continue;
    const rest = mm[2].split(/\bfrom\b|\bjoin\b/)[0];
    for (const cm of rest.matchAll(/\b(\w+)\s*(?:=|>|<|>=|<=|!=|<>|like|ilike)\s*/g)) {
      const c = cm[1];
      if (/^\w+$/.test(c) && !KW.has(c) && !/^\d/.test(c)) addCol(table, c);
    }
  }
}

// ---------- 3. report ----------
console.log('DECLARED TABLES (' + order.length + '):', order.join(', '));
console.log('\n=== A. COLUMNS REFERENCED BY CODE BUT NOT DECLARED IN MIGRATIONS ===');
const unknown = new Map();
for (const { table, col } of allRefs) {
  if (schema[table] && !schema[table].has(col)) {
    if (!unknown.has(table)) unknown.set(table, new Set());
    unknown.get(table).add(col);
  }
}
if (!unknown.size) console.log('(none)');
for (const [t, cols] of unknown) {
  console.log(`  ${t}: ${[...cols].sort().join(', ')}`);
}

console.log('\n=== B. TABLES QUERIED BY CODE BUT NOT IN MIGRATIONS ===');
console.log([...UNKNOWN_TABLES].sort().join(', ') || '(none)');

console.log('\n=== C. DECLARED COLUMNS NEVER REFERENCED BY CRM CODE ===');
for (const t of order) {
  const cols = schema[t];
  if (!cols.size) continue;
  const referenced = used.get(t) || new Set();
  const never = [...cols].filter((c) => !referenced.has(c)).sort();
  if (never.length) console.log(`  ${t} (${never.length}/${cols.size}): ${never.join(', ')}`);
}

console.log('\n=== D. DECLARED COLUMNS WITH NO INDEX (search/filter/sort candidates) ===');
const migrationSql = readdirSync('supabase/migrations').sort()
  .map((f) => readFileSync(join('supabase/migrations', f), 'utf8')).join('\n');
for (const t of order) {
  const indexed = new Set([...migrationSql.matchAll(/CREATE INDEX IF NOT EXISTS\s+(\w+)\s+ON\s+(\w+)\s*\((\w+)\)/g)]
    .filter((m) => m[2] === t).map((m) => m[3]));
  const unindexed = [...schema[t]].filter((c) => !indexed.has(c) && /_id$|^status$|^email$|^phone$|^created_at$|^reference$/.test(c));
  if (unindexed.length) console.log(`  ${t}: ${unindexed.sort().join(', ')}`);
}