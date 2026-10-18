# SafarTour CRM workflow audit

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

**Runtime limitation:** the CRM workflow is database-backed. Source-level flow is
verified, but authenticated success, persistence, and data counts are **blocked** by
the current database connectivity failure.

## Public enquiry workflow

```text
EnquiryForm
  -> shared leadSchema validation
  -> POST /api/leads
       -> honeypot response
       -> per-process in-memory IP limiter
       -> Google Apps Script / Sheet when configured
       -> optional Resend email when Sheets fails or is absent
       -> structured server log fallback
       -> client WhatsApp fallback on failed response/network timeout
```

The shared schema is used by the public form and endpoint
(`src/lib/validations.ts:5-61`). The endpoint sanitizes control characters and
supports `tour`, `car`, and `contact` form types
(`src/app/api/leads/route.ts:61-74`; `src/config/forms.ts:12-26`). The client
serializes the validated payload once and builds the WhatsApp message from it
(`src/lib/leads.ts:22-25,76-122`).

### Workflow gaps

| Gap | Verified evidence | Consequence |
| --- | --- | --- |
| No CRM handoff | `/api/leads` has no DB import or insert (`route.ts:1-3,76-169`) | Website enquiries do not create CRM customers/trips in current code |
| Sheets endpoint is public configuration | `NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` is read at `route.ts:76` and documented in `forms.ts:36-41` | Direct endpoint abuse can bypass this server's validation/rate limit |
| Rate limit is process-local | `rateBuckets` is a module `Map` (`route.ts:5-21`) | It is not a shared deployment-wide limit |
| No idempotency key | Request payload and downstream row have no request ID (`route.ts:61-74,85-90`) | Retries/double submissions can duplicate rows |
| No attribution handoff | Public schema stores page text but has no UTM/referrer fields (`validations.ts:17-19,49-55`) | Campaign attribution is not captured by this path |
| Sequential internal creation | New-lead UI creates customer, then trip in two requests (`NewLeadForm.tsx:86-136`) | A trip failure can leave a customer without its intended lead |

## Internal CRM workflow

The internal forms create or update a customer, then create a `trips` row used as a
lead. The API calculates passenger totals, assigns an employee, writes the trip,
increments the customer's trip count, and appends an activity
(`src/app/crm/api/trips/route.ts:129-176,262-304`). The quick flow follows the same
customer-then-trip sequence with less information
(`src/app/crm/(protected)/leads/quick/page.tsx:31-86`).

The configured lifecycle is:

```text
new -> contacted -> requirement_collected -> quotation_preparing
    -> quotation_sent -> negotiation -> booking_pending -> booked
    -> trip_ongoing -> completed
                          \-> lost / cancelled
```

The statuses, priorities, sources, trip types, payment methods, follow-up types,
and document types are centralized in `src/config/crm.ts:1-184`.

## Feature workflow inventory

| Workflow | Current source evidence | Current assessment |
| --- | --- | --- |
| Manual lead creation | `/crm/leads/new` and `NewLeadForm.tsx` | **Implemented in source; DB runtime blocked** |
| Quick lead creation | `/crm/leads/quick/page.tsx` | **Incomplete**: success route uses a reference where `[id]` requires an integer |
| Customer deduplication | `customers/route.ts:56-86` | Phone duplicate check exists; normalization and transaction-wide dedup are absent |
| Lead status updates | `trips/[id]/status/route.ts` and activity helpers | **Implemented in source; live persistence unverified** |
| Quotations and items | quotation pages/API and PDF handler | **Implemented in source; live persistence/PDF runtime unverified** |
| Payments | payment page/API/entity actions | **Implemented in source; live persistence unverified** |
| Follow-ups and tasks | pages, APIs, and activity logging | **Implemented in source; completion/audit semantics need verification** |
| Itineraries | `/crm/itineraries` list plus nested trip itinerary API | List exists; trip-page authoring UI is not demonstrated in the inspected files |
| Documents | list page plus upload/download APIs | **Incomplete**: no visible upload control/download link; local disk storage |
| Supplier/hotel/driver catalog | admin pages and APIs | **Implemented in source; admin live behavior unverified** |
| Dashboard/reports/search | shell calls search; dashboard/report/pipeline APIs/pages exist | **Implemented in source; live data unverified** |
| Activity timeline | `src/lib/crm/activity.ts:40-55,146-224` | App activity entries are written/read; dedicated `audit_logs` writer is not shown |

## Data and control boundaries

- Employees can be assigned leads through the current trip API; the route defaults
  assignment to the current session when absent (`trips/route.ts:173-179`).
- The lead list has `assignedTo` filtering, but the current customer list endpoint
  does not apply an employee-specific record filter (`customers/route.ts:20-35`).
- Permission helpers allow all sessions to view customers, quotations, follow-ups,
  and tasks (`src/lib/crm/permissions.ts:22-24,34-36,58-73`). Their enforcement
  should be tested against the actual handler queries after DB recovery.
- The activity timeline is application-generated; there is no database trigger or
  immutable audit-log evidence in the current source.

## Current versus target workflow

| Current | Proposed target |
| --- | --- |
| Sheet/email/log first for public enquiries | Durable CRM intake first, then Sheet/email/WhatsApp notifications |
| Two independent calls for customer and trip creation | One transactional command or compensating workflow with idempotency |
| Shared process-local lead limiter | Shared rate-limit/idempotency store with observable rejection metrics |
| Status/activity helpers exist but no dedicated audit trail | Every sensitive state/assignment/payment/document action emits an immutable audit event |
| Documents disconnected from trip workspace | Trip workspace owns document lifecycle, authorization, and retention |
| Runtime success depends on an unresolved external DB | Restore/identify the DB, then prove each workflow with seeded disposable data |

## Acceptance criteria

- Each public form type creates exactly one durable CRM customer and lead for a
  unique request, even after a client retry.
- The owner can trace a lead from source page/campaign through assignment, status,
  quotation, payment, follow-up, trip completion, and activity/audit history.
- A failed downstream Sheet/email notification does not make the primary CRM record
  unavailable or produce a false success state.
- Employee and admin workflow tests demonstrate authorized visibility and mutation
  boundaries for customers, leads, quotations, payments, documents, and settings.
- Quick lead, new lead, detail navigation, document upload/download, and every
  nested trip resource pass authenticated route smoke tests.
