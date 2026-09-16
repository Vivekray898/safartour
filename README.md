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
```

## Environment variables

Copy `.env.example` → `.env.local` and set:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Canonical URLs, sitemap, JSON-LD |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | WhatsApp number, international format without `+` (e.g. `917001588581`) |
| `NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT` | recommended | Apps Script web-app URL where leads are stored. See **[GOOGLE-SHEETS-SETUP.md](./GOOGLE-SHEETS-SETUP.md)** |
| `RESEND_API_KEY` / `ENQUIRY_TO_EMAIL` | optional | Email fallback when the Sheets write fails |

Business details (phone numbers, address, hours, social links) live in **`src/data/site.ts`**; the config layer in **`src/config/site.ts`** wraps it with the env overrides above. Change a phone number in one file, it updates everywhere.

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
