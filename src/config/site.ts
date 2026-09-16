/**
 * Centralized site configuration.
 *
 * This is the single place to change business details. It wraps the richer
 * data module in `src/data/site.ts` (which also holds nav/footer data) so
 * existing imports keep working, while the values an owner is most likely
 * to change can be overridden from environment variables — no component
 * edits required.
 *
 * Set these in `.env.local` (see `.env.example`):
 *   NEXT_PUBLIC_WHATSAPP_NUMBER=917001588581
 *   NEXT_PUBLIC_SITE_URL=https://safartour.in
 */

import { siteConfig as dataSiteConfig } from "@/data/site";

export const site = {
  name: dataSiteConfig.name,
  fullName: dataSiteConfig.fullName,
  legalName: dataSiteConfig.legalName,

  /** Production site URL (used for metadata, canonicals, JSON-LD). */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://safartour.in",

  /** Primary phone in tel: format (digits, no spaces). */
  phone: dataSiteConfig.phone,
  phoneDisplay: dataSiteConfig.phoneDisplay,
  altPhone: dataSiteConfig.altPhone,
  altPhoneDisplay: dataSiteConfig.altPhoneDisplay,

  /** WhatsApp number in international format WITHOUT "+" (e.g. 917001588581). */
  whatsapp:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    dataSiteConfig.whatsapp,

  email: dataSiteConfig.email,
  address: dataSiteConfig.address,
  hours: dataSiteConfig.hours,
  social: dataSiteConfig.social,
} as const;

/** `tel:` href for the primary phone. */
export function telHref(): string {
  return `tel:${site.phone}`;
}

/** `mailto:` href. */
export function mailtoHref(): string {
  return `mailto:${site.email}`;
}
