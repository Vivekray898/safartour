# SafarTour security audit

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.
The implementation update below is uncommitted and was checked separately.

**Method:** source-level review of authentication, authorization, input handling,
file handling, external integrations, configuration, and committed credential
material. Findings below are limited to high-confidence control gaps or directly
observable security risks. This is not a penetration test.

## Risk summary

The highest-risk remaining items are the privileged database connection with
policy-light RLS, the local filesystem document path, and incomplete record-level
authorization. The live database and deployment could not be verified, so exposure
of any particular environment is not claimed.

## Findings

### S-01 — Default CRM credential material was committed (Mitigated locally; migration still pending)

- **Evidence:** `supabase/migrations/002_seed_data.sql:5-18`,
  `README.md:61-71`, `supabase/README.md:13-26`,
  `src/app/crm/(auth)/login/page.tsx:155-160`,
  `scripts/route-check.mjs:13-15`, and `scripts/e2e-crm.mjs:8-18`.
- **Observation:** The original audit found the same demo credential seeded,
  documented, displayed on the login page, and used as a script fallback. The
  working tree now disables seed users, removes public password copy, requires
  explicit smoke-test credentials, and adds migration `007_disable_demo_credentials.sql`.
- **Impact:** Anyone applying the seed as-is can attempt login with publicly known
  credentials. A reused password would make this a direct account compromise.
- **Remaining remediation:** Apply migration 007 only to the owner-approved target,
  rotate any account that may have used the seed, and provision real users through
  `pnpm crm:user`.

### S-02 — Public lead endpoint configuration bypasses server controls (High)

- **Evidence:** `src/app/api/leads/route.ts:5-21,76-90` and
  `src/config/forms.ts:35-41` use a `NEXT_PUBLIC_` Apps Script endpoint.
- **Observation:** The endpoint value is intentionally browser-visible, while the
  server's Zod validation and in-memory rate limit are not applied to direct calls
  to that external endpoint.
- **Impact:** A caller can post directly to the Apps Script and bypass this app's
  validation/rate limiting, causing spam or quota consumption.
- **Remediation:** Make the mirror URL server-only, accept only server-to-server
  writes, validate a signed request or shared secret at the mirror, and retain a
  durable primary CRM write.

### S-03 — RLS is enabled statically but does not express CRM authorization (High)

- **Evidence:** `supabase/migrations/001_initial_schema.sql:376-398` enables RLS
  without defining policies for the listed CRM tables; migration 004 only defines a
  `company_settings` policy (`004_crm_quality.sql:52-56`). The app uses a privileged
  `DATABASE_URL` path described in `001_initial_schema.sql:11-15` and
  `src/lib/crm/db.ts:16-21`.
- **Observation:** Browser-level Supabase access is closed by default, but the app
  connection is outside an end-user RLS policy model. Record boundaries are then
  dependent on custom code; several view helpers return `true` for every role
  (`src/lib/crm/permissions.ts:22-24,34-36,58-73`).
- **Impact:** A handler or permission regression can expose cross-employee CRM
  records. RLS does not provide a second authorization boundary for the privileged
  connection.
- **Remediation:** Define and test explicit RLS policies, use a session-aware
  Supabase client for user-scoped operations, and make employee/admin record rules
  explicit in handlers and database policies.

### S-04 — Login throttling was missing (Mitigated locally; distributed control pending)

- **Evidence:** The original implementation had no limiter. The working tree now
  validates login input, returns a uniform failure for inactive/unknown accounts,
  and limits five failed attempts per IP per 15-minute process window in
  `src/lib/crm/login-rate-limit.ts`.
- **Remaining remediation:** Move the limiter to a shared durable store before
  multi-instance deployment, add monitoring, and provide a recovery flow.

### S-05 — CRM session bearer tokens are stored as plaintext database values (High)

- **Evidence:** `src/lib/crm/auth.ts:41-59,97-120` creates a UUID, stores the
  token directly in `sessions.token`, and compares the cookie value directly. The
  cookie lifetime is 30 days (`auth.ts:6-8`).
- **Impact:** A database read or backup exposure gives an attacker reusable session
  tokens until expiry or deletion. There is no visible token hashing or rotation.
- **Remediation:** Store only a hash of a high-entropy token, rotate on login and
  privilege changes, provide revocation/session management, shorten idle lifetime,
  and audit session events.

### S-06 — Sensitive documents use local application storage (High)

- **Evidence:** `src/app/crm/api/documents/upload/route.ts:33-64` accepts files,
  writes them under `process.cwd()/crm-documents`, and records a local path;
  `src/app/crm/api/documents/[id]/route.ts:23-43` reads that path for an
  authenticated caller.
- **Impact:** Files are not durable across instances, may be unavailable after a
  deployment, and are difficult to apply consistent retention, backup, malware,
  and object-level access controls to. These document types include identity and
  payment material (`src/config/crm.ts:139-151`).
- **Remediation:** Use a private object store with per-record authorization and
  short-lived signed URLs; validate size/type/content, record retention, and test
  restore/download behavior.

### S-07 — Lead PII is written to ordinary server logs on fallback (Medium)

- **Evidence:** `src/app/api/leads/route.ts:108-169` includes name, phone, email,
  destination, message, and receipt time in the structured fallback log.
- **Impact:** Hosting log retention and access become a second PII store. Logs may
  be copied to systems without the CRM's retention/access controls.
- **Remediation:** Use a durable redacted event/queue, minimize logged fields, set
  retention and access controls, and never log credentials or full document data.

### S-08 — CRM request schemas are not centralized or consistently bounded (Medium)

- **Evidence:** A repository search found no `safeParse`/`.parse` call under
  `src/app/crm/api/**`; handlers destructure raw JSON, for example
  `customers/route.ts:47-85` and `trips/route.ts:135-260`. Values are generally
  passed as SQL parameters, so this finding is not an SQL-injection claim.
- **Impact:** Invalid enum, length, numeric, ownership, and cross-field values can
  reach business logic and database constraints inconsistently.
- **Remediation:** Define per-command schemas, reject unknown/oversized fields,
  enforce enum/range/ownership rules server-side, and test negative cases.

### S-09 — Login response revealed account state (Mitigated locally)

- **Evidence:** The original route returned 403 for inactive accounts. The working
  tree now returns the same 401 `Invalid credentials` response for inactive,
  unknown, and wrong-password cases (`auth/login/route.ts:35-55`).
- **Remaining remediation:** Add controlled security telemetry without revealing
  account state to the caller.

### S-10 — Baseline security headers were missing (Mitigated locally)

- **Evidence:** The original config had images and redirects only. The working tree
  now sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a
  conservative `Permissions-Policy` in `next.config.ts:54-69`.
- **Remaining remediation:** Add a tested CSP and HSTS only after external asset
  and HTTPS behavior are confirmed.

## Positive controls observed

- Public lead input uses a shared Zod schema and a honeypot
  (`src/lib/validations.ts:11-59`; `src/app/api/leads/route.ts:37-50`).
- The deployed public-lead RPC is not executable by `anon` or `authenticated`; a
  publishable-key authorization test returned HTTP 401. The server-only secret
  path remains the only intended caller.
- The two known seeded legacy users were disabled on the linked project by the
  owner-authorized `007_disable_demo_credentials.sql` migration.
- SQL values in the inspected customer/trip paths are passed as parameters rather
  than interpolated into values (`customers/route.ts:23-30,84-86`; `trips/route.ts:290-291`).
- The CRM session cookie is HTTP-only, uses `sameSite: 'lax'`, and is secure in
  production (`src/lib/crm/auth.ts:52-59`).
- CRM pages have a protected layout and API handlers perform session checks.

## Secret review result

The nine new audit files contain no passwords, hashes, API keys, database URLs,
session tokens, private keys, or live endpoint values. Source references identify
credential/configuration risks without reproducing their values. `.env.local` was
not read into the reports.

## Current versus target security architecture

| Current | Proposed target |
| --- | --- |
| Custom session table and privileged database path | Session-aware least-privilege access with hashed/revocable sessions |
| Static RLS enablement, few policies | Tested policy matrix for anonymous, employee, admin, and object access |
| Per-process lead limiter | Shared rate limit plus idempotency store |
| Local document files | Private object storage and expiring signed URLs |
| Disabled seed placeholders; real admin still must be provisioned | Owner-created admin and secret rotation workflow |
| No central CRM request schemas or security headers | Typed command validation and a reviewed header/CSP policy |

## Acceptance criteria

- No production seed, README, login page, or script contains a usable default
  credential.
- Login throttling is shared across instances, monitored, and tested for both
  unknown and known accounts without response-state leakage.
- RLS/authorization tests prove employees cannot read or mutate records outside
  their assigned scope, while admins retain approved access.
- Session tokens are hashed at rest, rotated/revoked, and expire according to an
  owner-approved policy.
- Documents are stored durably and privately; negative authorization tests confirm
  no cross-trip or cross-customer download.
- A security scan and dependency scan are run in CI, with findings triaged before
  production deployment.
