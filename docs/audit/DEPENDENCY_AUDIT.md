# SafarTour dependency and reproducibility audit

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

This is a manifest/configuration audit, not a vulnerability database report. No
dependency upgrade or package-file change was made.

## Direct dependencies

| Package | Manifest declaration | Lockfile evidence / role |
| --- | --- | --- |
| `next` | `16.3.5` | Locked at `16.3.5`; framework/build |
| `react`, `react-dom` | `19.2.8` | Locked at `19.2.8`; UI runtime |
| `typescript` | `^5` | Locked at `5.9.3`; compiler |
| `eslint`, `eslint-config-next` | `^9`, `16.3.5` | Locked; lint |
| `tailwindcss`, `@tailwindcss/postcss` | `^4`, `^4` | Locked at `4.3.3`; styling |
| `zod` | `^4.6.5` | Locked at `4.6.5`; public lead validation |
| `postgres` | `^3.4.7` | Resolved at `3.4.9`; CRM database driver |
| `bcryptjs`, `@types/bcryptjs` | `^3.0.3`, `^3.0.0` | Locked; password verification/hashing |
| `lucide-react` | `^1.46.0` | Locked at `1.46.0`; icons |
| `playwright` | `^1.63.0` | Locked at `1.63.0`; available for scripts, not a package test runner |

Evidence: `package.json:5-32` and `pnpm-lock.yaml:1-62`. The pnpm lockfile is
present and uses lockfile version 9. There is no npm, Yarn, or Bun lockfile in the
current tree.

## Runtime and build reproducibility

| Control | Current state | Assessment |
| --- | --- | --- |
| Package manager version | `packageManager: pnpm@11.20.0` | **Verified / good** |
| Node version | `.nvmrc` and `README.md:19-23` | **Pinned to 24.19.0 locally; deployment parity still unverified** |
| Dependency install | `pnpm install` documented | **Documented; clean-machine install not rerun** |
| Build command | `pnpm build` -> `next build --webpack` | **Verified pass on current machine** |
| Lint command | `pnpm lint` | **Verified pass with 84 warnings** |
| Type check | `pnpm exec tsc --noEmit` | **Verified pass** |
| Test command | `pnpm test` -> `node scripts/test.mjs` | **Verified offline static checks** |
| Container | No `Dockerfile` | **Missing** |
| Offline build/test contract | No Makefile or fixture-backed test harness | **Unverified/missing** |

`pnpm-workspace.yaml` only configures native build approvals for `sharp` and
`unrs-resolver`; it does not define a workspace package or test command.

## External runtime dependencies

| Dependency | Current integration | Verification state |
| --- | --- | --- |
| Supabase PostgreSQL | `postgres` driver via `DATABASE_URL` | **Blocked**: current `db-check` DNS failure |
| Google Apps Script / Sheets | public env endpoint and `google-apps-script/Code.gs` | **Unverified**: no live test row was submitted |
| Resend | direct HTTPS call when two env values are present | **Unverified**: configuration and delivery not tested |
| WhatsApp | `wa.me` links generated client-side | **Source verified; external delivery unverified** |
| Supabase Storage | direct REST calls in `src/lib/crm/storage.ts` | **Unverified**; secret-key naming is aligned locally, live bucket state has no buckets |
| Vercel or other host | README deployment guidance only | **Unverified**: no deployment config is in this tree |

## Current command evidence

- `pnpm lint`: **PASS**, 0 errors and 84 warnings.
- `pnpm test`: **PASS**, offline static checks completed.
- `pnpm exec tsc --noEmit`: **PASS**.
- `pnpm build`: **PASS**, production route generation completed.
- `node scripts/phase0-schema-diff.mjs`: **RAN**, but its static parser emitted
  alias-derived false positives and cannot validate a live schema.
- `node --env-file=.env.local scripts/db-check.mjs`: **FAIL / BLOCKED** at DNS.
- `node --env-file=.env.local scripts/schema-audit.mjs`: **BLOCKED** by the
  30-second command limit with no result.

The prior phase docs report earlier passes, but those are **Historical** and do not
replace the current results above.

## Dependency risks and gaps

1. A floating `^5` TypeScript declaration and several caret ranges permit future
   installs to move within a major line; the lockfile currently controls the known
   install, but lockfile refresh policy is undocumented.
2. Node is pinned locally, but deployment parity with `.nvmrc` is unverified.
3. There is no production dependency audit result in the current docs or command
   record. A future `pnpm audit`/SBOM result is **unverified**, not assumed clean.
4. `playwright` is a direct runtime dependency but there is no package test script
   that consumes it; smoke scripts use Node directly.
5. The current build is reproducible on this machine, but clean Linux rebuild,
   system package requirements, and offline operation are not demonstrated.

## Current versus target dependency setup

| Current | Proposed target |
| --- | --- |
| pnpm lockfile and package-manager pin | Keep lockfile immutable in CI and document refresh ownership |
| Node runtime | Pin a supported Node LTS version in `.nvmrc` or equivalent | 
| `pnpm test` static checks | Expand with fixture-backed workflow tests when the database target is known |
| No Dockerfile | Add a minimal Linux build/run image with all system packages declared |
| External DB/Sheet/Resend required for full workflows | Keep integration tests opt-in and provide deterministic local fixtures for offline checks |

## Acceptance criteria

- A clean Linux checkout installs using only the committed lockfile and pinned
  runtime version.
- One documented offline test command exits 0 without Supabase, Sheets, Resend, or
  production credentials.
- CI runs lint, typecheck, build, the offline tests, and a dependency/SBOM scan with
  recorded results.
- Integration checks clearly fail fast with a non-secret configuration error when
  live services are unavailable.
