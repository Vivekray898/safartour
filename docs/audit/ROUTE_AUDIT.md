# SafarTour route audit

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

**Status terms:** `Verified` means route structure or protection is visible in the
current source/build. `Blocked` means runtime behavior needs a live dependency.
`Historical` means a prior phase document reported a runtime result that was not
repeated here.

## Route architecture

The current build is a Next.js App Router application. The production build
completed successfully and emitted static, SSG, and dynamic route classifications.
Marketing content is mostly static; CRM pages and CRM APIs are dynamic because the
CRM reads a session cookie and database on request.

## Public route surface

| Route family | Current source | Current status |
| --- | --- | --- |
| `/`, `/about-us`, `/contact`, `/faq`, `/gallery`, `/privacy-policy`, `/terms` | `src/app/(site)/*/page.tsx` | **Verified in build** as static routes |
| `/packages`, `/packages/[slug]`, `/packages/[slug]/[package]` | `src/app/(site)/packages/**` | **Verified in build**; generated from `src/data/packages.ts` and destinations |
| `/car-rentals`, `/car-rentals/[slug]` | `src/app/(site)/car-rentals/**` | **Verified in build**; generated from `src/data/vehicles.ts` |
| `/routes`, `/routes/[slug]` | `src/app/(site)/routes/**` | **Verified in build**; generated from `src/data/routes.ts` |
| `/guides`, `/guides/[slug]` | `src/app/(site)/guides/**` | **Verified in build**; generated from `src/data/guides.ts` |
| `/robots.txt`, `/sitemap.xml` | `src/app/robots.ts`, `src/app/sitemap.ts` | **Verified in build** |
| `/api/leads` | `src/app/api/leads/route.ts` | **Verified source**: `POST` only; no `GET` export |

`src/app/sitemap.ts:13-69` derives URLs from static content arrays. The sitemap
does not include CRM routes. `src/app/robots.ts:4-14` allows the site and only
disallows `/api/`; it does not explicitly disallow `/crm`.

`next.config.ts:3-46` contains permanent redirects for legacy `/pages/*` routes
and older guide slugs. These redirects are source-verified; redirect behavior was
not separately exercised in this pass.

## CRM page surface

| Route | Source | Protection / status |
| --- | --- | --- |
| `/crm/login` | `src/app/crm/(auth)/login/page.tsx` | **Verified source/build**; separate auth layout, static in build |
| `/crm` | `src/app/crm/(protected)/page.tsx` | **Verified protected layout**; runtime data is DB-dependent |
| `/crm/leads`, `/crm/leads/new`, `/crm/leads/quick`, `/crm/leads/[id]` | `src/app/crm/(protected)/leads/**` | **Verified source**; DB-dependent at runtime |
| `/crm/customers`, `/crm/customers/[id]` | `src/app/crm/(protected)/customers/**` | **Verified source**; DB-dependent at runtime |
| `/crm/quotations`, `/crm/quotations/[id]` | `src/app/crm/(protected)/quotations/**` | **Verified source**; DB-dependent at runtime |
| `/crm/payments`, `/crm/tasks`, `/crm/followups`, `/crm/itineraries` | `src/app/crm/(protected)/**` | **Verified source**; DB-dependent at runtime |
| `/crm/documents` | `src/app/crm/(protected)/documents/page.tsx` | **Verified source**; list is present, upload/download UI is incomplete |
| `/crm/hotels`, `/crm/suppliers`, `/crm/drivers` | `src/app/crm/(protected)/**` | **Verified source**; admin navigation and API checks are present |
| `/crm/reports`, `/crm/settings` | `src/app/crm/(protected)/**` | **Verified source**; admin navigation and API checks are present |

The protected layout is the page-level authority: it sets `force-dynamic` and calls
`requireAuth()` before rendering `CRMShell` (`src/app/crm/(protected)/layout.tsx:4-27`).
The shell exposes 14 navigation entries and role-filters admin-only links
(`src/components/crm/layout/CRMShell.tsx:19-34,46-79`).

## CRM API surface

The build emitted route handlers for authentication, customers, trips, quotations,
payments, tasks, follow-ups, documents, reports, search, settings, hotels,
suppliers, drivers, dashboard, pipeline, and nested trip resources. The source
tree contains handlers under `src/app/crm/api/**` for:

- authentication: `login`, `logout`, `me`;
- entity CRUD: customers, trips/leads, quotations/items, payments, hotels,
  suppliers, drivers;
- workflow resources: status, activities, communications, itinerary, documents,
  follow-ups, and tasks;
- operational views: dashboard, pipeline, reports, search, settings, and logo.

Source inspection found `requireApiUser()` or `requireAdminApi()` guards across the
data and workflow CRM API handlers (`src/app/crm/api/**/route.ts`). Login, logout,
and the public lead handler are separate endpoints with intentionally different
authentication behavior.

## Route findings

### R-01 — Quick lead success link was structurally incompatible — fixed locally

The original version stored only a trip reference such as `ST-...` and navigated
to `/crm/leads/${tripRef}`. The detail page requires a positive integer. The
working tree now stores both values and uses the numeric `trip.id` for the detail
link while keeping the reference visible (`leads/quick/page.tsx:13-16,80-112`).

### R-02 — Documents route has list output but no complete route path for files

The documents page renders `file_name` as text and its empty-state copy points to a
trip-page upload flow (`src/app/crm/(protected)/documents/page.tsx:64-71,75-109`).
The current source has upload and download handlers, but no file input or download
link in that page. The handler also writes to the local filesystem
(`src/app/crm/api/documents/upload/route.ts:42-64`).

### R-03 — Detail navigation is incomplete

The inspected lead and customer detail headers contain action links and related
record links but no explicit breadcrumb/back-to-list control
(`src/app/crm/(protected)/leads/[id]/page.tsx:75-109` and
`src/app/crm/(protected)/customers/[id]/page.tsx:95-124`). The working tree also
removes unsupported `customerId` query parameters from the customer actions. The
prior phase document also reported no back links on three detail pages, but that
broader count is marked **Historical** rather than re-used as a current grep result.

### R-04 — Follow-up dashboard links used the follow-up ID — fixed locally

The dashboard now projects `f.trip_id` and both overdue/today widgets link to
`/crm/leads/${f.trip_id}`. The previous implementation incorrectly used the
follow-up row ID (`src/app/crm/(protected)/page.tsx:75-118`,
`src/components/crm/dashboard/FollowUpWidget.tsx:6-95`).

### R-04 — Public lead route has no CRM route handoff

`src/app/api/leads/route.ts:1-3,76-169` imports validation/config only. It sends
the lead to Sheets, optional email, or a log; it does not import `getDb`, create a
customer, or create a trip. This is a verified source-level separation, not a claim
about what an external Sheet currently contains.

## Current versus target route architecture

| Current | Proposed target |
| --- | --- |
| Static public route data plus a public lead passthrough | Public lead intake writes a durable CRM record first, then mirrors/notifications fan out |
| Page protection through one protected layout; API protection repeated per handler | Keep a single page boundary and add a tested central API authorization policy |
| Numeric database IDs in detail paths; quick flow emits a reference | Choose one canonical identifier strategy and test every list/create/detail transition |
| Documents have disconnected handlers and local storage | Trip workspace owns upload/list/download through a private object store and signed URLs |
| CRM routes rely on live Supabase Postgres but cannot be runtime-verified now | Restore/identify the DB, then run authenticated route smoke tests against a disposable or approved environment |

## Acceptance criteria

- `pnpm build` continues to emit every intended public and CRM route.
- An authenticated quick lead creates a customer and trip, then its success action
  opens the corresponding detail page without a 404.
- Every CRM detail page has an accessible breadcrumb or back link to its parent list.
- A user can upload, list, and download an authorized document from a trip workspace;
  an unauthorized user receives 401/403 and no file bytes.
- A public enquiry produces a durable CRM record before any optional mirror/email
  attempt, with an idempotency key preventing retry duplicates.
