# Decisions

Every non-obvious choice, with its reason. Append-only — never rewrite history;
supersede with a new entry.

---

## D-001 · Phase 0 runs EXPLAIN, not a live schema dump

**Date:** 2026-10-04 · **Phase:** 0

`scripts/schema-audit.mjs` runs `EXPLAIN` (plans a query, executes nothing)
against the live database rather than `pg_dump` or `SELECT *` on every table.

**Why:** it is the strongest possible evidence that the code's SQL matches the
real schema — `EXPLAIN` fails with `42703` / `42P01` for a missing column or
table exactly as the running app would — while writing nothing and locking
nothing.

**Superseded in practice:** the project host did not resolve, so this could not
run. `scripts/phase0-schema-diff.mjs` was written as a static substitute,
parsing `supabase/migrations/*.sql` and diffing it against every SQL string in
the CRM source. Weaker — it can only see what the migrations declare, not what
the live database actually contains. Revisit once D-007 is answered.

---

## D-002 · Lighthouse mobile with a Playwright-style fallback

**Date:** 2026-10-04 · **Phase:** 0

Performance is measured with Lighthouse in mobile form factor (360×640, DPR 2,
simulated throttling) against the production build, not against `next dev`.

**Why:** simulated mobile throttling on a production build is the number that
correlates with field data. `next dev` adds HMR overhead and skips
optimisation, so it would understate the site's real performance.

**Fallback that was NOT needed:** Lighthouse was not installed, but
`registry.npmjs.org` was reachable, so `npx lighthouse` succeeded on all four
pages. The Playwright CWV fallback was prepared but never used.

**Known limits recorded honestly:** INP and production TTFB are **not**
measurable this way and are marked UNVERIFIED in the audit. INP needs a scripted
interaction; TTFB must be measured on the deployed URL.

---

## D-003 · Column-name noise is excluded from the schema audit

**Date:** 2026-10-04 · **Phase:** 0

The static schema diff reports "columns referenced by code but not declared".
Most of that output is **false positives** caused by JOIN alias attribution —
a query like `SELECT c.name FROM trips t LEFT JOIN customers c …` attributes
`name` and `phone` to `trips`.

**Decision:** the audit's schema section leads with the **dead-column** table
(declared but never referenced), which is noise-free and the actionable
direction, and mentions the false-positive caveat where relevant. Section B
("tables queried but not declared") is reported clean, because that check is
unambiguous.

---

## D-004 · Keep `TEXT` dates and `INTEGER 0/1` booleans

**Date:** 2026-10-04 · **Phase:** 0

`src/lib/crm/db.ts` deliberately translates SQLite-flavoured SQL to Postgres and
the schema stores dates as `TEXT` and booleans as `0/1`. Converting to
`timestamptz` / `boolean` looks like a cleanup. **It is not, and Phase 1 must not
do it.**

**Why:** roughly 300 inline SQL strings across 45 handlers and 15 pages compare
and sort these columns as text. A type change would require touching every one
of them and would silently change date sorting, because `TEXT` comparison of
`2026-10-4` vs `2026-10-12` is not the same as date comparison.

**When to revisit:** only in Phase 3, if the CMS needs real temporal queries
(scheduled publishing, date-range reports), and then behind its own migration
with a full regression pass.

---

## D-005 · Supabase Storage replaces disk storage with a **private** bucket

**Date:** 2026-10-04 · **Phase:** 0 (recorded now, implemented Phase 1)

CRM documents move from `process.cwd()/crm-documents` to a private Supabase
Storage bucket served via short-lived signed URLs.

**Why not a public bucket:** the current logo bucket (`crm-logos`) is public
because a PDF needs a fetchable URL. Customer documents are ID proofs, passports
and payment receipts — they must not be world-readable, and a leaked signed URL
should expire.

**Consequence:** `next.config.ts` will need the Supabase Storage domain added to
`images.remotePatterns` when the CMS serves media through it.

---

## D-006 · The `/api/leads` rate limiter is in-memory and therefore not real

**Date:** 2026-10-04 · **Phase:** 0

The plan says to *keep* the honeypot and rate limit when rebuilding
`/api/leads`. Audit finding: the rate limit is a module-level `Map`, which does
not survive across Vercel lambda instances and resets on every cold start.

**Decision:** keep the honeypot and the intent, but replace the mechanism. In
Phase 2 the limit moves to Supabase (a `lead_rate_limits` / `lead_requests`
table) so it is shared across instances, which doubles as the idempotency store
for L4 (duplicate submissions).

**Also decided:** `NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` is dropped. The Apps
Script endpoint being a `NEXT_PUBLIC_` variable means its value ships to every
browser, letting anyone post directly and bypass validation and rate limiting.
It becomes a server-only var.

---

## D-007 · Phase 1 is blocked on the Supabase project

**Date:** 2026-10-04 · **Phase:** 0

The configured project `nbpnlbfxnmypqgabxikd` does not resolve in DNS
(`ENOTFOUND`) and the pooler reports `tenant not found`, while `example.com`,
`supabase.com` and `registry.npmjs.org` all return 200 from the same shell.

**Conclusion:** the project is deleted, renamed, or the ref in `.env.local` is
wrong. The CRM is non-functional today.

**Decision:** do not guess and do not create a replacement project. Escalated to
the owner as decision **D1** in `docs/AUDIT.md` §7, together with **D2** (where
the real lead data lives). No migration may be written until this is answered,
and before anything touches a live database the owner must take a backup and
confirm it.

---

## D-008 · AI crawlers: allow (default), subject to owner confirmation

**Date:** 2026-10-04 · **Phase:** 0 (recorded now, applied Phase 4)

Plan default is to allow search and answer engines (`OAI-SearchBot`, `GPTBot`,
`ClaudeBot`, `PerplexityBot`, `Google-Extended`).

**Reasoning:** this is a lead-generation business. An AI assistant answering
"best time to visit Sikkim" or "Siliguri to Gangtok taxi fare" with the agency's
price is the intended outcome, and denying the crawlers forfeits that with no
SEO upside. The risk is content being scraped and reposted, which is a content
problem, not an access-control one.

**Recorded as UNCONFIRMED** — it is raised with the owner as **D9** and applied
only on explicit approval, in `robots.ts` and `docs/DECISIONS.md`.

---

## D-009 · Phase 0 adds two read-only scripts

**Date:** 2026-10-04 · **Phase:** 0

`scripts/phase0-lighthouse.mjs` and `scripts/phase0-schema-diff.mjs` are added
and committed. Both are read-only, write nothing into the repo (Lighthouse output
goes to `/tmp/lh-safartour/`), and are safe to re-run at any time.

**Why commit them:** the perf baseline must be reproducible to prove the Phase 4
before/after numbers are real, and the schema diff is what substitutes for the
EXPLAIN audit until D-007 is resolved. Neither adds a dependency — Lighthouse is
invoked through `npx` on demand, not installed.

---

## D-010 · Legacy `users`/`sessions` auth is NOT removed in Phase 1

**Date:** 2026-10-04 · **Phase:** 1

Migration 005 adds `profiles`, uuid assignment columns and real RLS policies,
but the old integer-keyed `users` / `sessions` tables and the
`src/lib/crm/auth.ts` cookie session are **left in place**, and no CRM handler
is rewritten to use `supabase-js`.

**Why:** rewriting 45 handlers and 15 pages away from `DATABASE_URL` is only
meaningful once a live database exists to test against. Doing it blind would
mean pushing roughly 3,000 lines that could not be executed even once, which
is exactly what "never push a failing phase" forbids.

**Consequence:** after Phase 1 the app has two auth paths — the legacy one the
CRM still uses, and the Supabase one the proxy and new clients use. Phase 2
deletes the legacy path. Until then the CRM is no more reachable than it was in
Phase 0, because there is still no database.

---

## D-011 · `src/proxy.ts`, not `proxy.ts` at the repository root

**Date:** 2026-10-04 · **Phase:** 1

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The file must sit "at the
same level as `pages` or `app`" — and this project keeps `app` under `src/`,
so the proxy belongs at **`src/proxy.ts`**.

**Why it matters:** a root-level `proxy.ts` built successfully, passed
typecheck and lint, and was **silently ignored** — no `ƒ Proxy` line appeared in
the build output. Session refresh would simply never have run and nobody would
have known until users were mysteriously signed out. Caught by grepping the
build log for `ƒ Proxy (Middleware)` rather than trusting a green build.

**How it is verified now:** every Phase 1+ build checks for the `ƒ Proxy`
line. If it is missing, the phase fails.

---

## D-012 · Phone numbers are normalised by stripping all leading zeros

**Date:** 2026-10-04 · **Phase:** 1

`normalisePhone()` in `scripts/import-sheets-leads.mjs` strips *any* number of
leading zeros before adding the country code.

**Why:** an E.164 country code never begins with 0, so a leading 0 is always a
national trunk prefix. Indian mobiles typed with one (`09876543211`) and STD
landlines (`0354 123456`) both appear in real lead data. Without stripping, the
first became `+09876543211` — invalid, and it would not match `9876543211`, so
deduplication would silently fail and the same person would be created twice.

Phase 2 must use this exact function in `/api/leads`, not a second
implementation.

---

## D-013 · CSP allows `unsafe-inline` and `unsafe-eval` for scripts

**Date:** 2026-10-04 · **Phase:** 1

The Content-Security-Policy in `next.config.ts` ships with `'unsafe-inline'`
and `'unsafe-eval'` in `script-src`.

**Why:** Next.js App Router injects inline bootstrap scripts, and React needs
`eval`-style evaluation in development. A strict nonce-based policy needs
`proxy.ts` to generate a per-request nonce and thread it through, which is
meaningful work with no benefit until the site is otherwise finished.

**Revisit in Phase 4**, when a nonce-based policy can be added and measured. The
other five headers (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`) are strict now.