# Progress

Phase-by-phase status for Safar Tours. **Read this file first at the start of any
new session** and resume from the recorded state. Do not redo completed phases.

---

## Current state

| | |
|---|---|
| **Current phase** | Phase 0 — audit |
| **Phase 0 status** | ✅ **Complete, verified, pushed** |
| **Branch** | `phase-0-audit` |
| **Base** | `main` @ `4eea3d3` |
| **Awaiting** | Owner approval to merge to `main` and/or start Phase 1 |
| **Blocker for Phase 1** | Supabase project `nbpnlbfxnmypqgabxikd` does not resolve — see Phase 0 §7 D1/D2 |

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

**Status:** ⏸️ Not started — blocked on D1/D2.

Plan of record: Supabase Auth, real RLS, `proxy.ts` protection, Supabase Storage,
`profiles` table, zod on all inputs, one-time first-admin script, CSV import of
existing Sheets leads. Estimated 4–6 days once unblocked.

---

## Notes for future sessions

- The working tree carries **uncommitted redesign work** from earlier sessions
  (modified `package.json`, `pnpm-lock.yaml`, `src/app/(site)/*`,
  `src/app/globals.css`, `src/app/layout.tsx`, plus 13 untracked component files).
  **Do not revert or force-stage these.** They belong to the owner.
- `main` deploys to Vercel on merge. Never merge without explicit approval.
- `supabase/README.md` still documents the old `schema.sql` / `seed.sql` flow and
  publishes the `admin123` password. Update it in Phase 1.