# Safar Tours — Website

Production website for **Safar Tours & Travels**, a Siliguri-based travel agency offering tour packages, car rentals and transfers across Sikkim, Darjeeling, Kalimpong, the Dooars and Northeast India.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · lucide-react**. Package manager: **pnpm**.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in values (see below)
pnpm dev                     # http://localhost:3000
pnpm build && pnpm start     # production
pnpm lint                    # eslint
pnpm test                    # offline static checks
```

## Requirements

- **Node.js** 24.19.0 (`.nvmrc`)
- **pnpm** 11.x (`packageManager` field pins it)
- **Supabase** project (hosted PostgreSQL) — the CRM stores all data there. No MySQL, no SQLite, no local database server.

## Environment variables

Copy `.env.example` → `.env.local` and set:

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_DB_URL` | yes (CRM) | Supabase Session Pooler PostgreSQL URI (server-only; preferred) |
| `DATABASE_URL` | fallback | Supabase PostgreSQL URI (server-only; direct URI may fail DNS in some environments) |
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Canonical URLs, sitemap, JSON-LD |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | WhatsApp number, international format without `+` (e.g. `917001588581`) |
| `NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` | recommended | Apps Script web-app URL where leads are stored. See **[GOOGLE-SHEETS-SETUP.md](./GOOGLE-SHEETS-SETUP.md)** |
| `RESEND_API_KEY` / `ENQUIRY_TO_EMAIL` | optional | Email fallback when the Sheets write fails |

Business details (phone numbers, address, hours, social links) live in **`src/data/site.ts`**; the config layer in **`src/config/site.ts`** wraps it with the env overrides above. Change a phone number in one file, it updates everywhere.

---

## CRM & Database (Supabase PostgreSQL)

The internal CRM (`/crm`) is a Next.js App Router app whose persistence layer runs on **Supabase's hosted PostgreSQL** via the [`postgres`](https://github.com/porsager/postgres) driver. Architecture:

```
Next.js 16 (App Router)
   → server components + route handlers  (src/app/crm/**)
   → src/lib/crm/db.ts                  (thin async SQL wrapper)
   → postgres driver over DATABASE_URL
   → Supabase PostgreSQL
```

There is no local database file, no SQLite and no MySQL anywhere in the project.

### 1. Create the Supabase project

Create a project at [supabase.com](https://supabase.com), then open **Project Settings → Database → Connection string → URI** and copy the URI (replace `[YOUR-PASSWORD]`).

### 2. Apply the schema & seed

In the Supabase **SQL Editor**, run the migrations in numeric order, `001` through
`009`. They cover the legacy-compatible CRM schema, Auth profiles and RLS,
private document Storage, credential cleanup, profile-update hardening, and the
CRM-first public lead RPC. Review migration `007` against the owner-approved
database before applying it because it deactivates two known seed addresses.

`002_seed_data.sql` creates demo rows with disabled placeholder users. It does not
publish or enable a default password.

After the migrations, provision the first account from a machine that has access to the database:

   ```bash
   CRM_BOOTSTRAP_PASSWORD='use-a-new-password' \
     pnpm crm:user -- admin@example.com 'Admin User' admin
   ```

   The password is read from the environment and is never printed. Use the
   `employee` role for a non-admin account. Do not reuse a password from this
   repository or commit `CRM_BOOTSTRAP_PASSWORD`.

### 3. Point the app at the database

`.env.local`:

```env
SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

The variable is server-only (no `NEXT_PUBLIC_` prefix), so the connection string never reaches the browser bundle.

### Security model

- **RLS is enabled on all tables** with no public policies: browser-facing anon/authenticated keys cannot read or write CRM data.
- The Next.js server is the only client and currently uses HTTP-only custom
  session cookies (`src/lib/crm/auth.ts`). The live database has the Auth/RLS
  foundation, but the request path has not yet migrated from the legacy session
  model and record-level assignment enforcement is not complete in the app.
- `SUPABASE_SECRET_KEY` is server-only. It is used by the public lead RPC and
  controlled server-side Storage operations.

### Local development & production build

```bash
pnpm dev      # development (marketing site + /crm)
pnpm build    # production build — must pass with DATABASE_URL set
pnpm lint     # eslint
```

### Deployment (Vercel)

Set in the Vercel project → Settings → Environment Variables:

- `DATABASE_URL` — the Supabase PostgreSQL URI (use the **transaction pooler** URI, port `6543`, for serverless friendlessness of idle connections; the app already runs with `prepare: false` for pooler compatibility)
- All `NEXT_PUBLIC_*` variables from the table above
- `CRM_SECRET_KEY`, `CRM_SITE_URL` as needed

Everything persists in Supabase — Vercel's serverless filesystem is not used for
CRM data. The document upload handlers still use local disk and must be migrated
to the private Storage bucket before production document workflows are enabled.

---

## Lead flow (zero-loss)

The core requirement: **no enquiry is ever silently lost.**

```
Visitor fills form (EnquiryForm)
        │  validate (zod, shared client/server schema)
        │  serialize the EXACT payload  ← kept until success
        ▼
POST /api/leads  ──────────────►  rate-limit (5 / IP / 10 min) + honeypot
        │
        ├─ 1. PRIMARY: forward to Google Apps Script
        │       (ONE spreadsheet, tab per formType: Tours / Cars / Contact)
        │
        ├─ 2. FALLBACK A: email via Resend (if configured)
        │
        └─ 3. FALLBACK B: structured server log

SUCCESS ──► "Thanks — we've received your enquiry." + WhatsApp / Call buttons
FAILURE ──► Amber notice + "Send my enquiry on WhatsApp" button with the
            visitor's exact submitted details pre-filled (nothing retyped,
            form never cleared)
```

Key properties:

- **Same payload everywhere** — the WhatsApp fallback message is generated from the exact validated submission, not re-read from form state.
- **12 s client timeout** (`AbortController`) — a hung request surfaces the fallback instead of spinning forever.
- **Double-submit disabled** while submitting.
- **No endpoint configured?** Still zero-loss: submissions land in server logs / email and the UI offers WhatsApp.
- **Bots** that fill the hidden honeypot get a fake success and are never stored.

### Form types

| `formType` | Where used | Sheet tab |
| --- | --- | --- |
| `tour` (default) | Header/hero/footer CTAs, package pages, homepage | `Tours` |
| `car` | Car rental pages, route pages | `Cars` |
| `contact` | Contact page | `Contact` |

Context (package name, route, page path) is captured automatically as `package` + `page` columns so the owner can see where each lead came from.

**Setting up Google Sheets:** follow the 12-step beginner guide in [GOOGLE-SHEETS-SETUP.md](./GOOGLE-SHEETS-SETUP.md). One script, one spreadsheet, tabs auto-create with headers on first write.

---

## Folder structure

```
src/
├── app/                    # App Router pages (all statically prerendered)
│   ├── api/leads/          # Lead passthrough API (the ONLY API route)
│   ├── packages/[slug]/[package]/
│   ├── car-rentals/[slug]/
│   ├── routes/[slug]/      # Point-to-point transfer pages
│   ├── guides/[slug]/
│   ├── contact/ about-us/ faq/ gallery/ terms/ privacy-policy/
│   ├── icon.svg            # Site icon (green "S" mountain mark)
│   ├── sitemap.ts robots.ts
│   └── layout.tsx          # Header/footer/CTA bar, Poppins via next/font
├── config/
│   ├── site.ts             # Business config (env-driven) — EDIT THIS for phone/WhatsApp
│   └── forms.ts            # Form-type registry, endpoint, timeout
├── components/
│   ├── forms/              # EnquiryForm (the one form), EnquiryModal
│   ├── layout/             # Header, MobileMenu, MobileCTABar, Footer, FloatingWhatsApp
│   ├── sections/           # TrustIntro, WhyChooseUs, FinalCTA, FAQ, …
│   ├── packages/ cars/ guides/ destinations/ gallery/ hero/ seo/ ui/
├── data/                   # EDIT THIS for content: packages, vehicles, routes,
│   │                       # destinations, guides, faqs, gallery, images, site (nav + business info)
└── lib/
    ├── leads.ts            # submitLead + WhatsApp fallback message builder
    ├── validations.ts      # zod lead schema (shared client/server)
    ├── whatsapp.ts         # wa.me message helpers per context
    ├── nav.ts              # shared active-link logic (header + mobile)
    └── seo.ts              # buildMetadata + JSON-LD builders
google-apps-script/Code.gs  # Paste into Apps Script (see setup guide)
```

## Editing content

- **Add/change a tour package** → `src/data/packages.ts` (itinerary, inclusions, gallery, FAQs all live per package)
- **Vehicles** → `src/data/vehicles.ts` · **Transfer routes** → `src/data/routes.ts`
- **Destinations** → `src/data/destinations.ts` · **Guides** → `src/data/guides.ts`
- **FAQs** → `src/data/faqs.ts` · **Nav/footer links, phone, address** → `src/data/site.ts`

New pages/entries are picked up automatically by `generateStaticParams`, `sitemap.ts` and internal links — no registry to maintain.

## Deployment notes

- Any Next.js-capable host (Vercel recommended). Set all env vars (including `NEXT_PUBLIC_*`) in the host dashboard — they're inlined at build time.
- The Apps Script URL is not secret (it only appends rows), but keep `RESEND_API_KEY` server-side only. No private credentials ship to the client.
- After changing `Code.gs`, redeploy a **new version** (same URL). After changing `.env.local`, restart/rebuild.
- `pnpm build` prerenders every marketing route statically; only `/api/leads` runs on demand.
