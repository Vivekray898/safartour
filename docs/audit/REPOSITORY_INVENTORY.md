# SafarTour repository inventory

**Audit basis:** current working tree on `main`, `HEAD 7a82771`, inspected 2026-10-18.

**Scope:** read-only inventory of the repository and its operational evidence. The
pre-existing working-tree changes to `.gitignore` and `.env.example` were preserved;
the nine files in `docs/audit/` are the only requested additions.

## Evidence legend

- **Verified:** directly observed in the current tree or produced by a command run
  against this tree.
- **Historical:** copied or summarized from `docs/AUDIT.md`, `docs/DECISIONS.md`, or
  `docs/PROGRESS.md`. Those documents describe a 2026-10-04 phase-0 branch and are
  not treated as current runtime proof unless independently re-run here.
- **Blocked / unverified:** requires a reachable deployment, database, external
  service, or owner decision.
- **Target:** proposed state for remediation; it is not implemented on current
  `main`.

## Repository state at audit start

| Item | Verified result |
| --- | --- |
| Branch | `main`, tracking `origin/main` |
| `HEAD` | `7a82771` (`Merge phase-0-audit: audit, decisions and progress log`) |
| Pre-existing changes | `M .gitignore`; untracked `.env.example` |
| Existing audit docs | `docs/AUDIT.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md` |
| New audit location | `docs/audit/` (created for this request) |
| Secret handling | `.env.local` is ignored and was not copied into these reports; values are not reproduced |

The status above is a snapshot before these audit files were created. The final
working-tree status will necessarily also contain the nine new Markdown files.

## High-level file inventory

`git ls-files` reported 198 tracked paths at inspection time:

| Area | Count / evidence | Purpose |
| --- | --- | --- |
| `src/app/` | 87 tracked files | Next.js App Router pages, layouts, route handlers, metadata |
| `src/components/` | 56 tracked files | Public UI, forms, CRM UI, shared primitives |
| `src/data/` | 9 data modules | Static marketing content and business configuration |
| `src/lib/` and `src/config/` | application libraries/config | Lead handling, SEO, CRM database/auth/activity/storage helpers |
| `supabase/` | 10 tracked files | README plus migrations `001`–`009` |
| `scripts/` | 7 tracked files | Build/runtime/schema smoke, audit, and CRM user provisioning scripts |
| `google-apps-script/` | 1 script | Google Sheets lead writer |
| `docs/` | 3 existing tracked docs before this request | Prior phase records; historical unless reverified |

## Stack and build inputs

| Layer | Current evidence |
| --- | --- |
| Framework | Next.js `16.3.5`, App Router (`package.json:11-19`) |
| Language | TypeScript; aliases configured as `@/* -> ./src/*` (`tsconfig.json:21-23`) |
| UI | React `19.2.8`, Tailwind CSS v4, `lucide-react` (`package.json:11-30`) |
| Database driver | `postgres` package; custom SQL compatibility wrapper (`src/lib/crm/db.ts:23-24,145-215`) |
| Validation | Zod is used by the public lead endpoint (`src/lib/validations.ts:1-71`); CRM handlers use inline checks rather than a shared schema |
| Package manager | `pnpm@11.20.0` in `package.json:32`; `pnpm-lock.yaml` is present |
| Runtime declaration | Node `24.19.0` is now pinned in `.nvmrc` |
| Tests | No `test` script in `package.json:5-10`; reusable smoke scripts exist under `scripts/` |
| Container/build contract | No `Dockerfile` or `Makefile` was found |

## Current architecture

```text
Public Next.js routes
  -> static TypeScript content in src/data/*
  -> /api/leads
       -> Google Apps Script / Sheets (configured primary path)
       -> optional Resend email
       -> structured server log fallback

CRM pages and /crm/api/*
  -> custom crm_session cookie + src/lib/crm/auth.ts
  -> src/lib/crm/db.ts
  -> postgres driver using DATABASE_URL
  -> Supabase PostgreSQL

CRM documents
  -> local process.cwd()/crm-documents directory in current upload handler
```

The public and CRM route groups have separate layouts. The root layout explicitly
keeps their chrome separate (`src/app/layout.tsx:24-31`), while the protected CRM
layout applies `requireAuth()` (`src/app/crm/(protected)/layout.tsx:4-27`).

## Current command evidence

These commands were run against the current tree on 2026-10-18:

| Command | Result | Interpretation |
| --- | --- | --- |
| `pnpm lint` | **PASS**, 0 errors, 84 warnings | Static lint is clean of errors; warnings remain |
| `pnpm test` | **PASS** | Offline static checks cover route identifiers, baseline headers, login controls, and credential-copy removal |
| `pnpm exec tsc --noEmit` | **PASS** | TypeScript emitted no diagnostics |
| `pnpm build` | **PASS** | Webpack production build completed and generated 67 static pages plus dynamic routes |
| `node scripts/phase0-schema-diff.mjs` | **RAN, not a clean proof** | It reports 18 migration-declared tables, but its regex parser emits known alias/SQL false positives; live DB was not involved |
| `node --env-file=.env.local scripts/db-check.mjs` | **FAIL / BLOCKED** | Connection failed with DNS `ENOTFOUND`; no live table or row evidence was obtained |
| `node --env-file=.env.local scripts/schema-audit.mjs` | **BLOCKED** | No result within the 30-second command limit; no EXPLAIN conclusion is claimed |

**Historical command record:** `docs/PROGRESS.md:38-51` and
`docs/AUDIT.md:484-501` record earlier phase-0 passes for lint, TypeScript, build,
and public smoke/performance checks, plus a blocked live database check. Those
results remain useful provenance but are not substituted for the current command
results above.

## Main inventory conclusions

1. The application builds from the current tree, but the CRM's external database
   dependency is not currently reachable.
2. The public site is content-driven from TypeScript modules; there is no CMS read
   path in the public route tree.
3. The repository has a lockfile and a pinned pnpm version, but not a pinned Node
   runtime, container recipe, or single offline test command.
4. Database recovery, live row counts, external lead delivery, production route
   behavior, and deployment configuration remain unverified.

## Implementation update after the audit snapshot

The first build step has now landed in the working tree (not yet committed):

- Confirmed route links now use numeric trip IDs for quick leads and dashboard
  follow-ups.
- Added baseline security response headers in `next.config.ts`.
- Removed usable demo credentials from the login UI, setup docs, seed path, and
  smoke-test defaults. Existing databases require the reviewed migration
  `supabase/migrations/007_disable_demo_credentials.sql` before provisioning a
  real account.
- Added `pnpm crm:user` for owner-controlled account provisioning and a bounded
  in-memory login failure limiter. These are interim controls while the planned
  Supabase Auth migration remains outstanding.

These changes do not prove live database safety or authorize applying migration
005 to any environment.

## Inventory acceptance criteria

- A clean checkout can identify the runtime, package manager, build command, and
  dependency lockfile without reading a developer `.env.local`.
- A future target commit adds a supported Node version pin, a reproducible container
  or equivalent build recipe, and a documented offline test command.
- The live database identity and backup source are owner-confirmed before any schema
  or data migration is attempted.
