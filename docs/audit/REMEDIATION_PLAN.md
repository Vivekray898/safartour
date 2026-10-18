# SafarTour remediation plan

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

This plan separates verified current defects from proposed target work. Migration
application and production changes still require the owner and the recovery gates
in `RECOVERY_PLAN.md`.

## Priority order

### P0 — protect access and preserve data

| Work item | Current evidence | Target / acceptance |
| --- | --- | --- |
| Replace default credentials | Usable seed/docs/UI/script defaults were removed locally; migration 007 is not applied | Apply reviewed migration 007 to the owner-approved target; provision first admin through `pnpm crm:user`; rotate any exposed accounts; negative login test passes |
| Identify DB and backup source | `db-check` fails DNS; no live row counts | Owner confirms project/data source; backup and restore test exist before writes |
| Protect document data | Local filesystem upload/download handlers | Private durable object storage, record-scoped authorization, expiring URLs, restore/download test |
| Define authorization boundary | Policy-light RLS and broad view helpers | Employee/admin matrix is explicit and tested at API and database layers |

### P1 — restore durable lead and CRM operation

| Work item | Current evidence | Target / acceptance |
| --- | --- | --- |
| Connect public intake to CRM | `/api/leads` now calls the deployed `create_public_lead` RPC before notification fan-out; no live valid test submission was made | One validated enquiry creates one customer/lead/activity exactly once, with an authorized integration test |
| Add shared rate limit/idempotency | Lead limiter remains process-local; CRM RPC now has a client submission ID and receipt table | Cross-instance abuse control plus CRM retries do not duplicate records |
| Reconcile schema/setup docs | README names missing `schema.sql`/`seed.sql`; db check omits `company_settings` | One migration source of truth; setup and checker agree on all 18 tables |
| Harden CRM input commands | No Zod parser in CRM API route handlers | Per-command schemas enforce lengths, enums, ranges, ownership, and unknown-field rejection |
| Harden login/session | Local five-failure/IP limiter and uniform errors now exist; bearer tokens remain stored directly and the limiter is process-local | Shared throttle, hashed/revocable/rotated sessions, security telemetry |

### P2 — finish staff workflows

| Work item | Current evidence | Target / acceptance |
| --- | --- | --- |
| Fix quick lead transition | Working tree now routes with numeric `trip.id`; no live CRM test was possible | Create -> detail transition is tested against the owner-approved database |
| Complete trip workspace | Nested trip APIs exist; pages do not demonstrate all callers | Status, quotation, payment, task, follow-up, itinerary, communications, activity, and document actions are discoverable from the trip |
| Complete documents UI | List renders file names; no visible upload/download controls | Authorized staff can upload/list/download/delete according to policy; errors are visible without leaking paths |
| Improve detail navigation | Inspected detail headers lack breadcrumbs/back controls | Keyboard-accessible parent navigation exists on every detail route |
| Add immutable audit trail | `activities` is app-written; `audit_logs` has no current writer | Sensitive mutations write actor, time, entity, old/new state, and request correlation |

### P3 — operations, performance, and maintainability

| Work item | Current evidence | Target / acceptance |
| --- | --- | --- |
| Pin runtime and build | pnpm is pinned, Node is only “20+”; no Dockerfile/Makefile/test script | Clean Linux build and one offline test command are reproducible |
| Add security/dependency CI | No current dependency audit/SBOM evidence | CI records lint, typecheck, build, offline tests, audit/SBOM results |
| Confirm production route/SEO behavior | Build is verified; deployed behavior and canonical domain are unverified | Live route/canonical/robots/sitemap checks pass on owner-approved domain |
| Measure external performance | No current production TTFB/INP evidence in this pass | Mobile performance budgets and scripted interaction measurements are recorded |

## Sequenced execution plan

1. **Owner gate:** complete G1–G3 in `RECOVERY_PLAN.md`; do not guess the database
   or import data.
2. **Security gate:** rotate/remove default credentials and establish a private
   secret-management path before reconnecting production traffic.
3. **Foundation:** reconcile migrations/checkers, restore or create the DB, apply
   explicit policies, and verify schema/row counts read-only.
4. **Intake:** implement durable CRM-first lead capture, shared rate limiting,
   idempotency, attribution fields, and notification retry handling.
5. **Workflow:** fix route identifiers, wire the trip workspace, complete documents,
   and add audit events/back navigation.
6. **Operations:** add runtime/container/test contracts, CI checks, monitoring,
   backup schedule, restore drill, and production smoke tests.

## Acceptance gate for production

Production remediation is complete only when all of these are true:

- `pnpm lint`, TypeScript, build, and the canonical offline test command pass.
- DB check and read-only schema audit pass against the owner-approved target.
- Public enquiries are durable, deduplicated, attributable, and observable.
- Employee/admin authorization and RLS tests pass for representative records.
- Default credentials are absent/rotated; login throttling and session revocation
  tests pass.
- Documents are private, durable, recoverable, and access-tested.
- Recovery backup, restore evidence, monitoring, rollback steps, and owner sign-off
  are recorded.
