/**
 * Centralized form + lead configuration.
 *
 * One Google Apps Script endpoint (ONE spreadsheet, multiple tabs) receives
 * every website lead. The `formType` field decides which tab the lead lands
 * in — see `google-apps-script/Code.gs` and `GOOGLE-SHEETS-SETUP.md`.
 *
 * Set in `.env.local`:
 *   NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT=https://script.google.com/macros/s/XXXX/exec
 */

/** Where a lead came from — routes to a tab in the Google Sheet. */
export type FormType = "tour" | "car" | "contact";

export const FORM_TYPES: readonly FormType[] = ["tour", "car", "contact"];

export function isFormType(v: unknown): v is FormType {
  return typeof v === "string" && (FORM_TYPES as readonly string[]).includes(v);
}

/** Tab names inside the Google Spreadsheet (keep in sync with Code.gs). */
export const SHEET_TABS: Record<FormType, string> = {
  tour: "Tours",
  car: "Cars",
  contact: "Contact",
};

/** Optional short label shown in admin notifications. */
export const FORM_TYPE_LABELS: Record<FormType, string> = {
  tour: "Tour enquiry",
  car: "Car rental / transfer enquiry",
  contact: "Contact message",
};

/**
 * Apps Script web-app URL. Empty by default — until it is set, submissions
 * are stored server-side only (log / optional email) and the form still
 * offers the WhatsApp fallback, so no lead is ever lost.
 */
export const GOOGLE_SHEETS_ENDPOINT =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT ?? "";

/** Client-side timeout for the lead POST, in milliseconds. */
export const LEAD_SUBMIT_TIMEOUT_MS = 12_000;
