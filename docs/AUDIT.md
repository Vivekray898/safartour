# Safar Tours & Travels — Phase 0 Audit

**Date:** 2026-10-04
**Branch:** `phase-0-audit` (from `main` @ `4eea3d3`)
**Scope:** Read-only audit. No application code was changed.
**Author:** Buffy (Codebuff), per `MASTER-PLAN.md` Phase 0.

---

## 0. Executive summary

> ## ⚠️ CORRECTION (added after Phase 1 work)
>
> **This audit originally concluded the Supabase project was dead. That was
> wrong.** The DNS failures that led to that conclusion were caused by a
> network outage on the machine running the audit, not by a deleted project.
>
> Re-checked with the Supabase CLI on 2026-10-04:
>
> - `supabase projects list` → the project exists: **"safsr tour nextjs"**,
>   `nbpnlbfxnmypqgabxikd`, Southeast Asia (Singapore), created 2026-09-20.
> - It holds **263 rows**: 15 customers, 13 trips, 15 quotations,
>   26 quotation_items, 11 payments, 11 followups, 10 tasks, 122 activities,
>   7 hotels, 5 drivers, 5 suppliers, 2 users, 20 sessions.
> - The API keys in `.env.local` are **valid** and working.
>
> **However:** on inspection, that data is *not* real business data. Customers
> 1–3 are the `002_seed_data.sql` demo rows (Rohan Sharma, Priya Singh,
> Amit Verma) and customers 4–15 are `E2E Renamed <timestamp>` rows created by
> `scripts/e2e-crm.mjs`. The only 2 users are the seeded `admin123` accounts.
>
> So: **no new Supabase project is needed, and there is no real CRM history to
> lose.** Real enquiries exist only in the Google Sheet and are recovered by
> `scripts/import-sheets-leads.mjs`. The anon key already returns **0 rows** on
> every CRM table, so the Phase 1 security gate is effectively already met.
>
> Everything below about the code is still accurate. Only the "no database"
> conclusion and §2.1 change.

The original (incorrect) finding was:

| Plan hypothesis | Verdict | Evidence |
|---|---|---|
| 1. Website and CRM disconnected | **Confirmed** | [route.ts](src/app/api/leads/route.ts) imports only zod + config; no Supabase client, no `getDb`. |
| 2. CRM is hand-rolled | **Confirmed** | [db.ts](src/lib/crm/db.ts) is a `postgres` + SQLite-dialect shim; [auth.ts](src/lib/crm/auth.ts) uses a `crm_session` cookie and a `sessions` table. |
| 3. CRM modules unlinked | **Partly wrong** | All 14 nav links resolve. But: no back-links/breadcrumbs on any detail page, and the Documents feature has no UI at all. |
| 4. `admin123` seed + disk storage | **Confirmed** | [002_seed_data.sql](supabase/migrations/002_seed_data.sql) seeds 2 users with one bcrypt hash; [documents/upload](src/app/crm/api/documents/upload/route.ts) `writeFile`s to `process.cwd()`. |
| 5. Content hardcoded | **Confirmed** | 11 modules in `src/data/`, zero DB reads from public pages. |
| 6. (bonus) Data loss risk | **Confirmed** | `trips.page_url`, `trips.referrer`, `trips.utm_*` exist but the website never sends them (0 matches for `utm_` on the public side). |

**Region note:** the project is in Southeast Asia (Singapore), not Mumbai. It
cannot be moved — Supabase region is fixed at creation. Singapore is still far
closer to India than US/EU, so it is acceptable; the Phase 4 recommendation
should be "put the Vercel function region near the database", not "move the
database".

**Overall:** the marketing site is in good shape (Lighthouse SEO 1.00 on all four
pages, CLS 0, no horizontal overflow at 360px). The CRM is effectively dead —
not because of bad code, but because its database is gone. Phase 1 should start
by re-establishing the database, not by writing migrations.

---

## 1. Route map

### 1.1 Public API

| Route | Status | Cause / notes |
|---|---|---|
| `POST /api/leads` | **Half-working** | Validation layer is correct and verified. Storage is Google Sheets + Resend + log. **Never writes to the CRM.** No Supabase import exists in the file. |
| `GET /api/leads` | **Absent** | Only `POST` is exported. |

### 1.2 CRM pages (`src/app/crm/(protected)/**`)

All are `ƒ (Dynamic)` except `/crm/login` which is `○ (Static)`.

| Route | Status | Cause |
|---|---|---|
| `/crm` dashboard | **Broken at runtime** | Renders only with a valid session; with a session cookie it took **3.33 s** and returned an error page with **HTTP 200**. |
| `/crm/leads` | Broken at runtime | Same DB dependency. |
| `/crm/leads/new` | Broken at runtime | Same. |
| `/crm/leads/[id]` | **Broken link from `/crm/leads/quick`** | See §4.2. |
| `/crm/leads/quick` | **Orphan + broken success link** | Not in the nav; its success button routes to a non-numeric id. |
| `/crm/customers`, `/crm/customers/[id]` | Broken at runtime | Same. |
| `/crm/quotations`, `/crm/quotations/[id]` | Broken at runtime | Same. |
| `/crm/payments`, `/crm/tasks`, `/crm/followups`, `/crm/itineraries` | Broken at runtime | Same. |
| `/crm/documents` | **Broken + orphaned** | No upload control and no download link anywhere. See §4.3. |
| `/crm/hotels`, `/crm/suppliers`, `/crm/drivers` | Broken at runtime | Admin-only via `requireRole`. |
| `/crm/reports`, `/crm/settings` | Broken at runtime | Admin-only. |
| `/crm/login` | **Works** (200, no DB) | Prerendered as static HTML. |

**Verified behaviour without a database** (production build, port 3210):

| Request | Result |
|---|---|
| `GET /crm` (no cookie) | `200` — redirect to `/crm/login` delivered in the body |
| `GET /crm/login` | `200` |
| `GET /crm/api/customers` (no cookie) | `401 {"error":"Not authenticated"}` |
| `GET /crm` (with cookie) | `200` after **3.33 s**, renders an error page |
| `POST /crm/api/auth/login` | `500 {"error":"Internal server error"}` |

The last two are the important ones: a logged-in user gets a **200 error page**,
not a 500. That breaks monitoring and caching semantics.

### 1.3 CRM API handlers (`src/app/crm/api/**`)

45 handlers. All call `requireApiUser()` or `requireAdminApi()` first — that part
is consistent. Findings:

- **No handler validates its input with zod.** Only `/api/leads` validates. Every
  other handler interpolates request JSON straight into SQL parameters.
- **No handler is rate limited.** Including
  [auth/login](src/app/crm/api/auth/login/route.ts) — unlimited password guessing.
- **16 handlers have no UI caller.** Verified by grepping `src/components` and
  `src/app/crm` for `crm/api/<name>`. Caveat: URLs built with template literals
  evade a plain grep — `quotations/[id]/pdf` is in fact used (via
  `` `/crm/api/quotations/${id}/pdf` `` in
  [quotations/[id]/page.tsx:72](src/app/crm/(protected)/quotations/[id]/page.tsx#L72)).
  The confirmed-orphaned ones are `dashboard`, `pipeline`, `reports`,
  `followups`, `tasks`, `documents/upload`, `documents/[id]`, `auth/me`, and all
  eight `trips/[id]/*` sub-resources.

That last group matters: `trips/[id]/status`, `/payments`, `/tasks`, `/followups`,
`/activities`, `/communications`, `/itinerary`, `/documents`, `/quotations` are a
complete nested REST API for updating a trip — **with no UI wired to it.** The
plan's Phase 2 "linked CRM" work is mostly already written as an API; it needs a
UI, not a rewrite.

---

## 2. Schema vs. what the UI uses

### 2.1 The live database could not be inspected — CORRECTED

`scripts/schema-audit.mjs` (EXPLAIN-only, no writes) was the planned tool. It
could not run at the time:

```
DNS:  nbpnlbfxnmypqgabxikd.supabase.co -> ENOTFOUND
PG :  (ENOTFOUND) tenant/user postgres.nbpnlbfxnmypqgabxikd not found
```

**That was a local network outage, not a dead project.** Re-run with the
Supabase CLI and the REST API, the project is reachable and the schema exists.
`scripts/db-inventory.mjs` now reproduces the inventory.

Live row counts (read-only, 2026-10-04):

| Table | Rows | | Table | Rows |
|---|---|---|---|---|
| activities | 122 | | itinerary_days | 0 |
| audit_logs | 0 | | payments | 11 |
| communications | 0 | | quotation_items | 26 |
| company_settings | 1 | | quotations | 15 |
| customers | 15 | | sessions | 20 |
| documents | 0 | | suppliers | 5 |
| drivers | 5 | | tasks | 10 |
| followups | 11 | | trips | 13 |
| hotels | 7 | | users | 2 |
| | | | **total** | **263** |

**Anon visibility check (Phase 1 gate):** the publishable key returns **0 rows**
for `trips`, `customers`, `users`, `sessions` and `quotations`. RLS is
effective for anon already.

### 2.2 Static diff (substitute evidence)

`scripts/phase0-schema-diff.mjs` parses `supabase/migrations/*.sql` for declared
columns and scans every SQL string in `src/app/crm` + `src/lib/crm`.

**18 tables declared:** `users`, `sessions`, `customers`, `trips`, `quotations`,
`quotation_items`, `payments`, `followups`, `tasks`, `activities`,
`communications`, `documents`, `itinerary_days`, `suppliers`, `hotels`,
`drivers`, `audit_logs`, `company_settings`.

**No table is queried that does not exist.** Good.

#### Dead columns (declared, never read or written by any code)

| Table | Dead columns | Meaning |
|---|---|---|
| `audit_logs` | **all 10** | The audit-log table is entirely unused. There is **no audit trail at all**. |
| `drivers` | `assigned_trip_id` | Driver↔trip assignment exists in schema but is never used. No assignment table either. |
| `customers` | `first_trip_at`, `last_trip_at`, `created_at` | Repeat-customer detection is declared but never implemented. `trip_count` / `is_repeat_customer` are never recomputed. |
| `quotations` | `sent_via`, `viewed_at`, `accepted_at`, `rejected_at` | Quotation lifecycle timestamps are never written — status changes are not dated. |
| `followups` | `completed_at`, `completed_by` | Follow-up completion is not recorded, even though `status` exists. |
| `suppliers` | `internal_rating` | Declared, never used. |
| `itinerary_days` | `date` | Declared, never used. |
| `communications` | `id`, `created_at` | Table is write-only or unused. |

#### Missing pieces the plan asks for

| Plan wants | Reality |
|---|---|
| `contacts` | Exists as `customers` |
| `leads` | Exists as `trips` |
| `bookings` | **Does not exist.** `trips.status='booked'` is the substitute. |
| `activities` timeline | Exists, but no DB trigger — written ad hoc by app code. |
| `pg_trgm` / full-text search | **Absent.** Search is `ILIKE '%q%'` — will not use an index. |

#### Missing indexes on hot columns

`users.email` (the login lookup), `customers.phone`, `customers.email` (the
dedup lookup), `quotations.reference`, `quotations.status`, `followups.status`,
`tasks.status`, `payments.transaction_id`, and every `created_at` used for
sorting. Existing indexes cover only FK columns and `archived`.

#### Data-typing problems

Every date/time and boolean is `TEXT` or `INTEGER 0/1`, by design (see the header
comment in [001_initial_schema.sql](supabase/migrations/001_initial_schema.sql))
so the UI would not need rewriting. This is deliberate and should be **kept** —
converting to real `timestamptz`/`boolean` now would break every one of the ~300
inline SQL strings. `company_settings` was added later with proper `INTEGER`
defaults, so the codebase is already inconsistent about this.

---

## 3. Lead flow, and every way data is lost or duplicated

### 3.1 The path

```
EnquiryForm (client)
  └─ zod validate (leadSchema)          ← correct, shared with server
  └─ POST /api/leads
       ├─ zod safeParse                 ← correct, 422 on failure
       ├─ honeypot check                 ← returns 200 fake success
       ├─ rate limit (in-memory Map)     ← see 3.3
       ├─ sanitize()                     ← strips control chars only
       ├─ POST → Google Apps Script      ← PRIMARY store
       ├─ POST → Resend                  ← only if Sheets failed
       └─ console.log                    ← last resort
  └─ on any failure → wa.me with full details pre-filled
```

**There is no step that writes to Supabase.** `src/app/api/leads/route.ts` has no
Supabase import at all. The CRM therefore receives **zero** website enquiries.

### 3.2 Verified API behaviour (production build)

| Test | Result |
|---|---|
| `POST /api/leads` with `{"name":"A"}` | `422` with field errors |
| `POST /api/leads` with honeypot filled | `200 {"ok":true}` — returns before any external call |
| `POST /api/leads` with malformed JSON | `400 {"ok":false}` |

No *real* submission was made: `NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` is set, so a
valid submission would have written a test row into your real Google Sheet. That
needs your approval — see §7.

### 3.3 Loss and duplication points

| # | Point | Impact |
|---|---|---|
| L1 | **Sheets unreachable + Resend unconfigured** | Lead exists only in Vercel logs. Verified reachable path: with `endpoint` set, a failure returns `502` and the client offers WhatsApp — so the *visitor* is saved, but the owner gets nothing unless they notice. |
| L2 | **`NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` is a `NEXT_PUBLIC_` var** | A public endpoint value shipped to the browser. Not a secret by design, but it widens the spam surface — anyone can post to the Apps Script directly, bypassing your zod validation and rate limit. |
| L3 | **Rate limiter is an in-memory `Map`** | `rateBuckets` is per Node process. On Vercel each lambda is a fresh process, so the limit resets constantly and does not work at all in production. Bots are effectively unthrottled. |
| L4 | **No idempotency** | No request id. A double-click, a network retry, or a user pressing back-and-resubmit creates duplicate rows. |
| L5 | **No UTM / referrer / landing-page capture** | `trips` has `utm_source`, `utm_medium`, `utm_campaign`, `campaign`, `page_url`, `referrer`. `grep -riE 'utm_|document.referrer|landing.?page'` over `src/components/forms`, `src/lib/leads.ts` and `src/app/api` returns **0 matches**. Marketing attribution is structurally impossible today. |
| L6 | **Failure fan-out is sequential and blocking** | Sheets must time out (10 s) before Resend is tried. The visitor can wait 10 s before the WhatsApp fallback appears. |
| L7 | **Validation error messages leak zod internals** | A user who omits their phone sees *"Invalid input: expected string, received undefined"* instead of a human message. Verified in the 422 response above. |
| D1 | **Duplicate rows on Sheets** | No dedup on phone number anywhere in the funnel. |
| D2 | **Google Sheets has no schema validation** | A changed form silently writes a shifted column layout into the sheet. |

---

## 4. UI/UX problems

### 4.1 No back-navigation anywhere in the CRM

Verified by grep across all three detail pages:

| Page | back-links | breadcrumbs |
|---|---|---|
| `leads/[id]/page.tsx` | 0 | 0 |
| `customers/[id]/page.tsx` | 0 | 0 |
| `quotations/[id]/page.tsx` | 0 | 0 |

On a phone, a staff member who taps a lead from a list and then wants out has no
in-page way back except the browser's back gesture. The plan explicitly requires
breadcrumbs and back links.

### 4.2 `/crm/leads/quick` is an orphan whose success link always 404s

[quick/page.tsx](src/app/crm/(protected)/leads/quick/page.tsx) receives
`data.trip.reference` (`"ST-2026-00006"`) and navigates to
`` `/crm/leads/${tripRef}` ``. But [leads/[id]/page.tsx:19](src/app/crm/(protected)/leads/[id]/page.tsx#L19)
does `const id = Number(idParam)`, and
[line 20](src/app/crm/(protected)/leads/[id]/page.tsx#L20) does
`if (!Number.isInteger(id) || id <= 0) notFound();` — so it **always 404s**.
The page is also absent from the nav.

### 4.3 The Documents feature has no interface

- The **only** file input in the entire CRM is the company logo in
  [settings/page.tsx:135](src/app/crm/(protected)/settings/page.tsx#L135).
- `/crm/api/documents/upload` therefore has **no caller**.
- [documents/page.tsx:83](src/app/crm/(protected)/documents/page.tsx#L83) renders
  `doc.file_name` as **plain text with no download link**, so
  `/crm/api/documents/[id]` also has no caller.
- The empty state promises *"documents uploaded from a trip's page will appear
  here"* — but the trip page has no upload control either.

So: a complete document feature exists as schema + two endpoints + a read-only
list, with no way in and no way out.

### 4.4 Other findings

- **Dead button:** the notification bell in
  [CRMShell.tsx](src/components/crm/layout/CRMShell.tsx) is a `<button>` with no
  `onClick` and no destination.
- **Duplicated taxonomy:** `src/config/crm.ts` and `src/components/crm/common/CRMStatusBadge.tsx`
  both define status colours. They can drift.
- **No toast/error system.** The settings logo upload uses `alert()`
  ([settings/page.tsx:146](src/app/crm/(protected)/settings/page.tsx#L146)).
- **WhatsApp link has no template** on the lead detail page — it opens `wa.me`
  with an empty message, so staff retype everything.

### 4.5 Public site at 360px — good

Measured on `/contact` at a 360 px viewport:

| Check | Result |
|---|---|
| Horizontal overflow | **0 px** |
| Inputs under 40 px tall | **0** |
| Inputs without an associated label | **0** |
| Lighthouse `target-size` | fails on testimonial carousel dots only |

---

## 5. Security review

### 5.1 Critical

| # | Finding | Location |
|---|---|---|
| S1 | **Seeded credentials in a committed migration.** Two users, password `admin123`, bcrypt hash `$2b$10$Xc7KV6v7...` in version control. The README publishes the password. | [002_seed_data.sql](supabase/migrations/002_seed_data.sql), [supabase/README.md](supabase/README.md) |
| S2 | **No rate limiting on login.** Unlimited password attempts against a known email address. | [auth/login/route.ts](src/app/crm/api/auth/login/route.ts) |
| S3 | **No `middleware.ts` / `proxy.ts` exists.** Protection is per-page `requireAuth()`. Any new route added under `/crm` without that call is public by default. | repo-wide |
| S4 | **Document uploads to the local filesystem.** `join(process.cwd(), 'crm-documents')` + `writeFile`. Vercel's filesystem is read-only except `/tmp`, so uploads fail in production; locally, files land outside `public/` with no serving route. | [documents/upload](src/app/crm/api/documents/upload/route.ts), [documents/[id]](src/app/crm/api/documents/[id]/route.ts) |
| S5 | **No zod validation on 45 CRM endpoints.** Bodies go straight into SQL parameters. `parseId` guards id-shaped params only. | `src/app/crm/api/**` |

### 5.2 High

| # | Finding | Location |
|---|---|---|
| S6 | **Session tokens stored and compared in plaintext**, 30-day lifetime, no rotation, no revocation on password change. | [auth.ts](src/lib/crm/auth.ts) |
| S7 | **RLS enabled on all 18 tables with zero policies.** Safe today only because the app connects as the table owner via `DATABASE_URL`, which **bypasses RLS entirely**. The RLS is decorative — the real authorisation is `permissions.ts`, which is hand-written and, per `canViewCustomer()` / `canViewQuotation()` / `canViewFollowUp()`, returns `true` for every role. Any signed-in staff member sees every customer, quotation and follow-up. | [001_initial_schema.sql](supabase/migrations/001_initial_schema.sql), [permissions.ts](src/lib/crm/permissions.ts) |
| S8 | **`storage.ts` uses the service-role key** to create buckets and overwrite objects, with a **public** `crm-logos` bucket. Server-only, so no client leak, but it should not be needed for a public asset. | [storage.ts](src/lib/crm/storage.ts) |
| S9 | **Legacy key variable names.** `.env.local` holds *new-format* values (`sb_publishable_…`, `sb_secret_…`) but under *legacy names* (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). The plan's Phase 1 rename is therefore a rename, not a value migration. | `.env.local` (values not reproduced here) |

### 5.3 Medium

| # | Finding |
|---|---|
| S10 | Upload allowlist includes `image/gif`, `.doc`, `.docx`, `.xls`, `.xlsx` with a 10 MB cap. No filename sanitisation beyond the generated name; original name stored verbatim in the DB. |
| S11 | `/crm/login` is a **static** page and `robots.ts` disallows only `/api/` — so `/crm/login` is crawlable and indexable. |
| S12 | Login differentiates "account disabled" (403) from "invalid credentials" (401) — a user-enumeration oracle. |
| S13 | No security headers (`X-Frame-Options`, `CSP`, `HSTS`, `Referrer-Policy`) anywhere in [next.config.ts](next.config.ts). |

---

## 6. SEO and performance baseline

### 6.1 Method

Lighthouse mobile (360×640, DPR 2, simulated throttling) against the **production
build** on `http://localhost:3210`. Reproduce with:

```bash
pnpm build && PORT=3210 pnpm start
node scripts/phase0-lighthouse.mjs      # raw JSON → /tmp/lh-safartour/
```

### 6.2 Scores

| Page | Perf | A11y | Best practices | SEO |
|---|---|---|---|---|
| `/` | **0.85** | 0.88 | 1.00 | 1.00 |
| `/packages/sikkim/sikkim-gangtok-getaway-3n4d` | 0.97 | 0.94 | 0.96 | 1.00 |
| `/car-rentals/suv` | 0.91 | 0.95 | 1.00 | 1.00 |
| `/guides/darjeeling-travel-guide` | 0.93 | 0.94 | 1.00 | 1.00 |

### 6.3 Core Web Vitals

| Page | LCP | FCP | SI | TBT | CLS |
|---|---|---|---|---|---|
| `/` | **4.4 s** ❌ | 0.9 s | 2.0 s | 20 ms | **0** ✅ |
| package | **2.6 s** ❌ | 0.9 s | 0.9 s | 30 ms | **0** ✅ |
| car-rental | **3.5 s** ❌ | 0.9 s | 1.4 s | 10 ms | **0** ✅ |
| guide | **3.2 s** ❌ | 0.9 s | 1.2 s | 30 ms | **0** ✅ |

Against the plan's targets (LCP ≤ 2.5 s, CLS ≤ 0.1): **CLS passes everywhere
with a perfect 0. LCP fails on all four pages.** Only FCP and TBT are healthy, so
the problem is entirely the LCP image, not the critical path.

- **INP: UNVERIFIED.** Lighthouse reports no interaction trace for a static
  navigation. TBT (10–30 ms) is a good proxy, but it is not INP. To measure INP
  you need a scripted interaction — run DevTools → Performance → record while
  opening the mobile CRM drawer and submitting the enquiry form.
- **TTFB: UNVERIFIED as a production figure.** Locally it was 0–10 ms, which
  measures nothing about Vercel. It must be measured on the deployed URL.

### 6.4 Payload

| Page | Requests | JS | Images | Fonts | Total |
|---|---|---|---|---|---|
| `/` | 39 | 256 KB | **372 KB** | 42 KB | 742 KB |
| package | 34 | 262 KB | 50 KB | 42 KB | 423 KB |
| car-rental | 34 | 259 KB | 177 KB | 42 KB | 536 KB |
| guide | 29 | 258 KB | 46 KB | 42 KB | 402 KB |

- JS is a consistent **~260 KB** across all pages — that is the floor. Lighthouse
  flags **~590 ms of savings from unused JavaScript** on the homepage.
- **Images dominate the homepage: 372 KB.** That is what is pushing LCP to 4.4 s.
- Fonts are a modest 42 KB (`DM Serif Display` + `Manrope`, already `next/font`).

### 6.5 Accessibility defects (homepage)

| Audit | Detail |
|---|---|
| `aria-prohibited-attr` | `aria-label="Rated 5 out of 5"` on a plain `<div>` (star ratings) — ARIA labels are prohibited on generic elements. |
| `color-contrast` | `bg-forest-600` link text fails contrast. |
| `label-content-name-mismatch` | `aria-label` on the logo and destination cards does not contain their visible text. |
| `target-size` | Testimonial carousel dots are `h-1.5` — far below the 24×24 minimum. |

### 6.6 SEO observations

- **Canonical domain mismatch.** `sitemap.xml` and `siteConfig.url` emit
  `https://safartour.in` (from `NEXT_PUBLIC_SITE_URL ?? "https://safartour.in"`),
  but you told me the site is deployed at `safartour.vercel.app`. If
  `safartour.in` is not the live domain, **every canonical and every sitemap URL
  points somewhere else.** Needs confirmation — see §7.
- Sitemap has 51 URLs and correctly **excludes** `/crm`.
- `robots.ts` does **not** exclude `/crm`, and `/crm/login` is statically
  prerendered and indexable.
- **Broken image on a package page:** a `next/image` request for an Unsplash
  photo 404s (caught as a console error on
  `/packages/sikkim/sikkim-gangtok-getaway-3n4d`). One of the 404s, not a systemic
  issue, but it is on a money page.
- Supabase region is **`ap-southeast-1` (Singapore)**, per the pooler host. For an
  India-based audience this is the wrong region and directly inflates lead-API
  TTFB. The plan already flags Mumbai; this confirms it is needed.

---

## 7. Decisions required from you

These are the items I must not guess.

| # | Decision | Why it blocks |
|---|---|---|
| D1 | **What happened to Supabase project `nbpnlbfxnmypqgabxikd`?** Deleted, renamed, paused, or was the ref wrong? Is there another project that holds the real data? | Phase 1 cannot write a single migration without knowing the target. |
| D2 | **Where is the real lead data?** You said real leads/customers exist. If they live in Google Sheets, Phase 1 needs the CSV export. If they lived in the dead project, they may be gone — please check for a Supabase backup or point me at another project. | Determines whether Phase 1 writes a migration script or a CSV importer. |
| D3 | **Backup confirmation.** Before any migration touches a live database I will ask you to take a backup and wait. Not needed yet — recorded for Phase 1. | Mandatory gate. |
| D4 | **Canonical domain** — is it `safartour.in` or `safartour.vercel.app`? | §6.6. Wrong answer means wrong canonicals site-wide. |
| D5 | **CMS: Option A (Supabase-native) or B (Payload 3)?** Plan recommends A. | Phase 3. |
| D6 | **Rename `customers`→`contacts` and `trips`→`leads`, or keep the current names?** Renaming touches ~300 inline SQL strings. | Phase 1/2 sizing. |
| D7 | **Should `bookings` become a real table?** Today `trips.status='booked'` stands in for it. | Phase 2 data model. |
| D8 | **May I submit one test lead to the live Google Sheet** to confirm the current end-to-end path still works? It writes one row to your real spreadsheet. | §3.2 verification gap. |
| D9 | **AI crawlers** — allow `OAI-SearchBot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`? Plan recommends allow, for a lead-gen business. | Phase 4. |

---

## 8. Recommended plan

Effort in working days for one engineer. Assumes D1 resolves to "we can reach or
restore a database".

### Phase 0 — audit *(this document)* — **done**

### Phase 1 — foundation — **4–6 days**

| # | Task | Size |
|---|---|---|
| 1.1 | Re-establish the database (depends on D1/D2) | 0.5–2 d |
| 1.2 | Apply migrations `001`–`004`; confirm the schema | 0.5 d |
| 1.3 | Delete seeded users; documented first-admin script | 0.5 d |
| 1.4 | Supabase Auth + `profiles`; `@supabase/ssr` browser/server clients; `proxy.ts` | 1.5 d |
| 1.5 | Real RLS policies; route all CRM reads/writes through the session client; drop `src/lib/crm/db.ts` | 1.5 d |
| 1.6 | Supabase Storage private bucket + signed URLs; delete disk storage | 0.5 d |
| 1.7 | zod on all CRM inputs, login rate limiting, security headers | 0.5 d |
| 1.8 | CSV importer for Sheets leads | 0.5 d |

**Gate:** anon key returns zero rows from every CRM table; roles behave as specified.

### Phase 2 — working CRM — **6–8 days**

The nested `trips/[id]/*` API already exists, so this phase is mostly **UI**:

| # | Task | Size |
|---|---|---|
| 2.1 | Breadcrumbs + back links on all detail pages | 0.5 d |
| 2.2 | Wire the orphaned `trips/[id]/*` handlers to a real trip workspace | 2 d |
| 2.3 | Document upload + download UI; Supabase Storage | 1 d |
| 2.4 | Rebuild `/api/leads` → Supabase first, then fan-out; idempotency; UTM capture | 1.5 d |
| 2.5 | Phone E.164 normalisation + contact dedup | 0.5 d |
| 2.6 | Dashboard, kanban, filters, bulk assign | 1.5 d |
| 2.7 | Fix `/crm/leads/quick`, dead bell, `alert()` → toast | 0.5 d |
| 2.8 | Quotation PDF polish + WhatsApp template | 0.5 d |
| 2.9 | Follow-up digest via Resend + Vercel Cron | 0.5 d |

**Gate:** each form type creates contact + lead + activity + task within seconds.

### Phase 3 — CMS (Option A) — **7–9 days**

Seed from `src/data/*.ts`, switch pages to DB reads with ISR +
`revalidateTag`, admin screens, `form_definitions`, `media`. Keep the TS files as
fallback until verified, then remove.

### Phase 4 — SEO / GEO / performance — **3–4 days**

Ordered by measured impact:

1. **Homepage hero image — 372 KB.** This alone is most of the 4.4 s LCP. Fix first.
2. Region → Mumbai (`bom1` for Vercel, `ap-south-1` for Supabase).
3. Cut unused JS (~590 ms identified).
4. Structured data, canonical-domain fix, `/llms.txt`, AI-crawler policy.
5. Fix the 4 accessibility defects.
6. Lighthouse CI with budgets; before/after into `docs/PERF.md`.

### Total: **20–27 working days.**

---

## 9. Reproducing this audit

```bash
pnpm lint                      # 0 errors, 85 warnings
npx tsc --noEmit               # clean
pnpm build                     # clean
PORT=3210 pnpm start &

node scripts/phase0-lighthouse.mjs    # perf baseline (mobile)
node scripts/phase0-schema-diff.mjs   # static schema vs code

# Blocked: needs a reachable database
node --env-file=.env.local scripts/schema-audit.mjs   # EXPLAIN against live DB
node --env-file=.env.local scripts/route-check.mjs    # CRM route smoke test
```

`scripts/phase0-lighthouse.mjs` and `scripts/phase0-schema-diff.mjs` were added in
this phase. Both are read-only and safe to re-run.