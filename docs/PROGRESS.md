# Progress

Phase-by-phase status for Safar Tours. **Read this file first at the start of any
new session** and resume from the recorded state. Do not redo completed phases.

---

## Current state

| | |
|---|---|
| **Current phase** | Phase 1 — foundation |
| **Phase 0 status** | ✅ Complete — merged to `main` @ `7a82771` |
| **Phase 1 status** | 🟡 In progress on `phase-1-foundation`, not merged |
| **Awaiting** | You create the Supabase project (see `docs/OWNER-GUIDE.md`) |
| **Blocker** | Supabase project `nbpnlbfxnmypqgabxikd` does not resolve; a fresh project is being created |

---

## Phase 0 — Audit

**Status:** ✅ Complete · **Code changed:** none (audit only) · **Merged to main:** no

### Commits on `phase-0-audit`

| SHA | Subject |
|---|---|
| `40efcc3` | Phase 0: audit of CRM, lead flow, schema, security, SEO and performance |

### Deliverables

- `docs/AUDIT.md` — the seven required sections, with evidence for each claim.
- `docs/DECISIONS.md` — 9 decisions (D-001 … D-009) with rationale.
- `scripts/phase0-lighthouse.mjs` — reproducible mobile perf baseline.
- `scripts/phase0-schema-diff.mjs` — static schema-vs-code diff.

### Verification

| Check | Result | How |
|---|---|---|
| `pnpm lint` | ✅ PASS | exit 0 — 0 errors, 85 warnings (all pre-existing) |
| `npx tsc --noEmit` | ✅ PASS | exit 0, no output |
| `pnpm build` | ✅ PASS | exit 0, all routes compiled |
| Audit §1 route map | ✅ PASS | Every route classified; runtime behaviour verified by curl on the production build |
| Audit §2 schema vs UI | ⚠️ PARTIAL | Static diff ran. **Live EXPLAIN blocked** — DB unreachable |
| Audit §3 lead flow | ✅ PASS | Full trace + 3 API behaviours verified by curl |
| Audit §4 UI/UX | ✅ PASS | Grep evidence for nav/breadcrumbs/orphans; 360px measured in-browser |
| Audit §5 security | ✅ PASS | 13 findings, each tied to a file |
| Audit §6 SEO + perf | ✅ PASS | Lighthouse ran on all 4 pages (mobile). INP and production TTFB UNVERIFIED |
| Audit §7 recommendations | ✅ PASS | 4 phases with day estimates + 9 decisions |

### Headline findings

1. **The Supabase project is gone.** `nbpnlbfxnmypqgabxikd.supabase.co` →
   `ENOTFOUND`; pooler → `tenant not found`. Control hosts return 200, so this is
   not a sandbox network block. **The CRM cannot reach a database today.**
2. `/api/leads` never touches Supabase — confirmed, no import exists in the file.
3. All 14 CRM nav links resolve (the plan's "dead links" hypothesis was wrong),
   but no detail page has a back link or breadcrumb.
4. The Documents feature has **no upload UI and no download link** — schema and
   two endpoints with no way in or out.
5. `/crm/leads/quick` always 404s: it routes a reference string where `[id]`
   requires an integer.
6. Login has no rate limiting; the lead rate limiter is an in-memory `Map` that
   does not survive serverless instances.
7. RLS is enabled with zero policies and is bypassed entirely by the
   `DATABASE_URL` owner connection. It is decorative, not protective.
8. Perf: SEO **1.00** on all four pages, **CLS 0** everywhere, but **LCP fails on
   all four** (4.4 s homepage). Homepage ships **372 KB of images**.
9. Supabase region is **Singapore**; the audience is India.

### Decisions needing your answer

Full list in `docs/AUDIT.md` §7. The two that block Phase 1:

- **D1** — what happened to the Supabase project? Deleted, renamed, or is the ref
  wrong? Is there another project holding the real data?
- **D2** — where does the real lead data actually live now (Sheets CSV export, a
  backup, or another project)?

The rest: D3 backup confirmation (gate, not yet due), D4 canonical domain
(`safartour.in` vs `safartour.vercel.app`), D5 CMS A or B, D6 rename
`customers`/`trips`, D7 real `bookings` table, D8 permission to submit one test
lead to the live Google Sheet, D9 AI-crawler policy.

### Pending manual steps for you

- [ ] **Answer D1 and D2** (blocking).
- [ ] Confirm the canonical domain (D4).
- [ ] Decide D5–D9.
- [ ] Confirm whether I may submit one test lead to the live Google Sheet (D8).
- [ ] *Before Phase 1's first migration touches any live database: take a
      Supabase dashboard backup (or `pg_dump`) and tell me it is done. I will
      wait for your confirmation.*
- [ ] **INP measurement** (UNVERIFIED): open the deployed site in Chrome DevTools
      → Performance → record on mobile emulation → open the mobile nav drawer and
      submit the enquiry form. Report the INP value.
- [ ] **Production TTFB** (UNVERIFIED): run
      `curl -o /dev/null -s -w '%{time_starttransfer}\n' https://safartour.vercel.app/`
      and report it.
- [ ] Optional: paste PageSpeed Insights results for the live URL.

---

## Phase 1 — Foundation

**Status:** 🟡 In progress · **Branch:** `phase-1-foundation` · **Merged to main:** no
· **Blocked on:** you creating the Supabase project (see `docs/OWNER-GUIDE.md`)

Owner decisions taken: **create a fresh project in Mumbai (ap-south-1)**, and
**recover lead history from a Google Sheets CSV export** (the old Supabase
project is unrecoverable, so no CRM trips/customers survive).

### What is done and verified

| Deliverable | Status |
|---|---|
| `supabase/migrations/005_auth_profiles_rls.sql` | ✅ written — `profiles`, role helpers, uuid assignment columns, real RLS on all 18 tables, `pg_trgm` search indexes |
| `supabase/migrations/006_storage_and_seed_cleanup.sql` | ✅ written — private `crm-documents` bucket + policies, deletes the `admin123` demo users |
| `src/lib/supabase/{client,server,proxy}.ts` | ✅ typecheck clean |
| `src/proxy.ts` | ✅ **registered** — verified by the `ƒ Proxy (Middleware)` line in the build |
| Security headers + CSP | ✅ verified served on a real request |
| `.env.example` | ✅ new publishable/secret key names |
| `scripts/create-first-admin.mjs` | ✅ written |
| `scripts/import-sheets-leads.mjs` | ✅ parsing + dedup verified against a sample CSV (13/13 phone cases) |
| `docs/OWNER-GUIDE.md` | ✅ plain-language setup steps |

**Deliberately NOT done** (see `docs/DECISIONS.md` D-010): the legacy
`users`/`sessions` auth and `src/lib/crm/db.ts` are still in place, and no CRM
handler is rewritten to `supabase-js`. That refactor is unverifiable until a
live database exists, and it is Phase 2 work.

### Verification

| Check | Result |
|---|---|
| `pnpm lint` | ✅ exit 0 — 0 errors, 86 warnings (none in new files) |
| `npx tsc --noEmit` | ✅ exit 0 |
| `pnpm build` | ✅ exit 0, `ƒ Proxy (Middleware)` present |
| Security headers served | ✅ curl against the production build |
| Public site unaffected by the proxy | ✅ `/`, `/packages`, `/contact` all 200 in <70 ms |
| `/api/leads` unaffected | ✅ 422 on invalid input, as before |
| Phone normalisation | ✅ 13/13 cases |
| CSV dry-run | ✅ 6 rows → 4 usable, 2 skipped, 1 repeat enquiry detected |

### Two real bugs caught by verification

1. **`src/proxy.ts` vs root `proxy.ts`.** At the repo root the proxy built and
   linted cleanly but was **never registered** — no `ƒ Proxy` line, and session
   refresh would silently never run. Fixed by moving it to `src/proxy.ts`.
2. **`normalisePhone()` mangled leading zeros**, turning `09876543211` into the
   invalid `+09876543211` and breaking deduplication. Fixed to strip all
   leading zeros; 13/13 cases pass.

### Blocked on you

Follow `docs/OWNER-GUIDE.md`:

- [ ] **Create the Supabase project** (Mumbai region) and paste back the
      Project URL, publishable key and secret key.
- [ ] Turn **off public sign-ups** in Authentication → Sign In / Providers.
- [ ] Enable **asymmetric signing keys** in JWT Settings.
- [ ] Set the three environment variables in **Vercel** and redeploy.
- [ ] Export the Google Sheet to CSV and tell me where it is.
- [ ] **Before I apply migrations 001–006 to the new project:** take a backup
      (or confirm the new empty project needs none) and tell me to go ahead.

### Not verified — needs a live project

- Migration SQL has never been executed. It is written carefully and is
  idempotent, but it is **untested**. Applying it is the next step and it
  requires your go-ahead.
- The RLS role behaviour ("admin sees everything, staff sees assigned or
  unassigned, drivers see only their own trips") is **untested**. Phase 1 is
  not complete until it is verified against the live project.

### Note on `package.json`

This phase's commits include `package.json` and `pnpm-lock.yaml`. They carry
the `@supabase/*` additions **and** the redesign dependencies from earlier
sessions (`framer-motion`, `@radix-ui/*`, `clsx`, `cva`, `tailwind-merge`),
which were uncommitted in the working tree. Committing the manifest is required
for the branch to build. The redesign components themselves remain uncommitted.

---

## Notes for future sessions

- The working tree carries **uncommitted redesign work** from earlier sessions
  (modified `package.json`, `pnpm-lock.yaml`, `src/app/(site)/*`,
  `src/app/globals.css`, `src/app/layout.tsx`, plus 13 untracked component files).
  **Do not revert or force-stage these.** They belong to the owner.
- `main` deploys to Vercel on merge. Never merge without explicit approval.
- `supabase/README.md` still documents the old `schema.sql` / `seed.sql` flow and
  publishes the `admin123` password. Update it in Phase 1.