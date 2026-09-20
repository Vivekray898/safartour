/**
 * CRM database engine — PostgreSQL (Supabase).
 *
 * The CRM used to run on better-sqlite3; it now runs on Supabase's hosted
 * PostgreSQL. This module keeps a small, better-sqlite3-compatible surface
 * (prepare().get/.all/.run) so the CRM's SQL keeps its exact semantics:
 *
 *  - `?` placeholders are translated to Postgres `$1..$n` parameters
 *  - `LIKE` is translated to `ILIKE` (SQLite LIKE is case-insensitive)
 *  - `datetime('now')` / `datetime("now")` become UTC text timestamps in the
 *    same `YYYY-MM-DD HH:MM:SS` format SQLite produced
 *  - INSERTs automatically get `RETURNING id` so `run()` can still report
 *    `lastInsertRowid`
 *  - 0/1 integer flags and TEXT date columns are preserved (no UI changes)
 *
 * The connection string comes from DATABASE_URL and must point at a Supabase
 * PostgreSQL database (Project Settings → Database → Connection string → URI).
 * It is server-only: it is never prefixed with NEXT_PUBLIC_, so it is never
 * shipped to the browser. Row Level Security is enabled on every table in
 * supabase/schema.sql so the database can only be reached through this server
 * code, which enforces the CRM's own session/role permissions.
 */
import postgres from 'postgres';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RunResult = { changes: number; lastInsertRowid: number };

export interface CrmStatement {
  get: (...params: any[]) => Promise<any>;
  all: (...params: any[]) => Promise<any[]>;
  run: (...params: any[]) => Promise<RunResult>;
}

export interface CrmDatabase {
  prepare: (query: string) => CrmStatement;
  exec: (query: string) => Promise<void>;
}

let _sql: postgres.Sql | null = null;

function getSql(): postgres.Sql {
  if (_sql) return _sql;

  const connectionString =
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error(
      '[CRM DB] DATABASE_URL is not configured. Set DATABASE_URL in .env.local to your ' +
        'Supabase PostgreSQL connection string (Supabase Dashboard → Project Settings → ' +
        'Database → Connection string → URI), then create the tables by running ' +
        'supabase/schema.sql and supabase/seed.sql in the Supabase SQL Editor. ' +
        'See supabase/README.md for the full setup.'
    );
  }

  _sql = postgres(connectionString, {
    // Supabase's transaction pooler (port 6543) does not support prepared
    // statements; `prepare: false` is required there and harmless elsewhere.
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    types: {
      // COUNT(*)/SUM() return int8 in Postgres. Parse them as JS numbers
      // (the CRM's counts/amounts are far below Number.MAX_SAFE_INTEGER)
      // so JSON responses keep the numeric shape the UI expects.
      int8: {
        to: 20,
        from: [20],
        serialize: (x: number | string) => String(x),
        parse: (x: string) => Number(x),
      },
    },
  });

  return _sql;
}

/** SQLite `datetime('now')` equivalent in Postgres, returned as TEXT. */
const NOW_TEXT = "to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')";

/**
 * Translate a SQLite-flavoured query to Postgres:
 *  - `?`  → `$1..$n` (skipping `?` inside string literals)
 *  - `LIKE` → `ILIKE` (case-insensitive, like SQLite)
 *  - `datetime('now')`/`datetime("now")` → UTC text timestamp
 */
function translateQuery(query: string): string {
  let out = '';
  let paramIndex = 0;
  let inString = false;

  for (let i = 0; i < query.length; i++) {
    const ch = query[i];

    if (inString) {
      out += ch;
      if (ch === "'") {
        if (query[i + 1] === "'") {
          out += "'";
          i++;
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      out += ch;
      continue;
    }

    if (ch === '?') {
      paramIndex++;
      out += `$${paramIndex}`;
      continue;
    }

    out += ch;
  }

  return out
    .replace(/\bLIKE\b/g, 'ILIKE')
    .replace(/datetime\(\s*(["'])now\1\s*\)/gi, NOW_TEXT);
}

function normalizeArgs(args: any[]): any[] {
  // better-sqlite3 allowed binding an array as the single argument.
  if (args.length === 1 && Array.isArray(args[0])) {
    args = args[0];
  }
  // Postgres has no undefined; booleans are stored as 0/1 integer flags,
  // exactly like the previous SQLite storage.
  return args.map(v => {
    if (v === undefined) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v;
  });
}

function prepare(query: string): CrmStatement {
  const translated = translateQuery(query);
  const isInsert = /^\s*insert\b/i.test(query) && !/\breturning\b/i.test(query);

  const execute = (sqlText: string, params: any[]): Promise<any[]> =>
    (getSql().unsafe as (q: string, p?: unknown[]) => Promise<any[]>)(sqlText, params);

  return {
    async get(...args: any[]) {
      const rows = await execute(translated, normalizeArgs(args));
      return rows[0];
    },

    async all(...args: any[]) {
      const rows = await execute(translated, normalizeArgs(args));
      return rows as any[];
    },

    async run(...args: any[]) {
      const sqlText = isInsert ? `${translated} RETURNING id` : translated;
      const rows = await execute(sqlText, normalizeArgs(args));
      const last = rows[rows.length - 1];
      return {
        changes: (rows as unknown as { count?: number }).count ?? rows.length,
        lastInsertRowid: last ? Number(last.id) : 0,
      };
    },
  };
}

/**
 * Get the CRM database handle. Same call shape as before:
 *   const db = getDb();
 *   await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
 */
export function getDb(): CrmDatabase {
  return {
    prepare,
    exec: async (query: string) => {
      await (getSql().unsafe as (q: string) => Promise<any[]>)(query);
    },
  };
}
