# SafarTour feature matrix

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

**Legend:** `Source complete` means the relevant route/components exist in the
current tree. `Blocked runtime` means the flow depends on the unresolved database.
`Incomplete` means a concrete UI/route/storage gap is visible. `Unverified` means an
external service or production deployment was not exercised.

| Feature | Current evidence | Current status | Target acceptance |
| --- | --- | --- | --- |
| Marketing home/content pages | `src/app/(site)/**`, `src/data/*.ts` | Source complete; build verified | All intended public pages render on the owner-approved domain |
| Packages/destinations | `src/app/(site)/packages/**`, `src/data/packages.ts`, `destinations.ts` | Source complete; SSG build verified | Content update, internal links, sitemap, and canonical checks pass |
| Car rentals/routes | `src/app/(site)/car-rentals/**`, `routes/**`, data modules | Source complete; SSG build verified | Every generated slug resolves and enquiry context is preserved |
| Travel guides | `src/app/(site)/guides/**`, `src/data/guides.ts` | Source complete; SSG build verified | Every published guide has valid metadata and route |
| Public enquiry form | `EnquiryForm`, `validations.ts`, `src/app/api/leads/route.ts`, `supabase/migrations/009_public_lead_intake.sql` | CRM-first path implemented and RPC deployed; no live valid test submission was made | Valid submission is durable in CRM, idempotent, attributable, and observable |
| Honeypot/rate limit | `route.ts:5-21,47-59` | Honeypot source complete; limiter is process-local | Shared abuse control works across instances |
| Google Sheets mirror | `google-apps-script/Code.gs`, forms config | Source/setup complete; live Sheet unverified | Server-only mirror receives validated rows with retry/dead-letter visibility |
| Resend fallback | `src/app/api/leads/route.ts:108-151` | Source complete; credentials/delivery unverified | Fallback retries safely and does not create duplicate primary records |
| WhatsApp fallback | `src/lib/leads.ts:76-122`, form components | Source complete; external handoff unverified | Exact submitted details open in an accessible, tested fallback action |
| CRM login | `login/page.tsx`, `auth.ts`, login API | Source complete; local throttling/uniform errors added; DB runtime blocked | Owner-created credentials, shared throttling, uniform errors, revocable sessions |
| CRM protected pages | `src/app/crm/(protected)/layout.tsx` | Protection source complete; DB runtime blocked | Every page returns correct auth/403/5xx semantics under smoke tests |
| Leads list/detail | `src/app/crm/(protected)/leads/**`, trips APIs | Source complete; DB runtime blocked | Assigned visibility, status changes, activity, and detail navigation work |
| New lead form | `NewLeadForm.tsx:75-143` | Source complete; internal CRM flow still uses two requests | Transaction/compensation prevents orphan customer records |
| Quick lead form | `leads/quick/page.tsx` | Source route-link defect fixed locally; DB runtime blocked | Successful creation opens the exact lead and has regression coverage |
| Customer records | customer pages/API/actions | Source complete; DB runtime blocked | Normalized dedup, ownership checks, archive/restore, and activity work |
| Quotations/items/PDF | quotation pages, APIs, PDF handler | Source complete; DB/PDF runtime unverified | Totals, status timestamps, PDF, download authorization, and audit events pass |
| Payments | payment page/API/actions | Source complete; DB runtime blocked | Amount/method validation, immutable/authorized recording, reconciliation, audit |
| Follow-ups | page/API/config/activity helpers | Source complete; DB runtime blocked | Assignment, completion timestamp/actor, missed state, and reminders work |
| Tasks | page/API/nested trip handler | Source complete; DB runtime blocked | Assignment, status transitions, due dates, and audit work |
| Itineraries | itineraries page and nested API | Partial; authoring from trip page not demonstrated | Trip workspace can create/edit/delete/list day plans with authorization |
| Documents | documents list plus upload/download APIs | **Incomplete**; no visible upload/download UI; local disk storage | Private durable storage, trip-scoped UI, signed downloads, retention/restore |
| Hotels/suppliers/drivers | admin pages/API/actions | Source complete; DB runtime blocked | Admin-only CRUD, archive/restore, relationship integrity, audit |
| Dashboard/pipeline/reports | pages and API handlers | Source complete; DB runtime blocked | Live metrics match reconciled database totals and permission scope |
| Search | `CRMShell.tsx:211-251`, search API | Source complete; DB runtime blocked | Bounded, authorized search with indexed fields and result navigation |
| Activity timeline | `src/lib/crm/activity.ts:40-224` | Source complete; dedicated audit log not shown | Immutable security audit stream covers sensitive actions |
| Supabase RLS | migrations 001/004 | Static enablement; policies incomplete; live state blocked | Policy matrix passes anonymous/employee/admin tests |
| Supabase Storage/logo | `src/lib/crm/storage.ts` | Source exists; secret-key naming aligned locally; live project has no buckets | Correct server-only key, private document bucket, public logo policy justified |
| SEO/sitemap/robots | `src/app/sitemap.ts`, `robots.ts`, `src/lib/seo.ts` | Source complete; production domain unverified | Canonical domain, sitemap, robots, and structured data match deployment |
| Backup/recovery | no backup artifact/config in tree; scripts are checks | **Unverified / not demonstrated** | Owner-approved backup schedule and tested restore runbook |
| Reproducible delivery | pnpm lock/packageManager, `.nvmrc`, and `pnpm test` now exist; no Dockerfile | **Partial** | Clean Linux rebuild, container, and offline test command pass |

## Highest-value feature order

1. Restore/identify the database and authoritative lead source.
2. Remove default credentials and establish authorization/RLS boundaries.
3. Make lead intake durable, idempotent, attributable, and CRM-connected.
4. Finish the trip workspace and documents lifecycle.
5. Add recovery, offline tests, deployment reproducibility, and production smoke
   checks.

## Uncertainty register

- No row counts, real-user records, live RLS policies, storage objects, or backup
  status were observable from the current shell.
- Existing phase-0 docs contain runtime/performance findings from an earlier branch;
  they are historical unless the current command table or source independently
  confirms them.
- Google Sheets, Resend, WhatsApp, production Vercel behavior, canonical domain,
  and owner decisions were not exercised or inferred.
