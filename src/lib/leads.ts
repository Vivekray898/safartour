import { site, telHref } from "@/config/site";
import {
  LEAD_SUBMIT_TIMEOUT_MS,
  type FormType,
} from "@/config/forms";
import type { LeadInput } from "@/lib/validations";

/**
 * Zero-loss lead pipeline (client side).
 *
 * 1. Validate (EnquiryForm does this).
 * 2. Serialize the EXACT validated payload once — success UI and the
 *    WhatsApp fallback are both built from the same object, so a failure
 *    never loses or re-shapes the visitor's data.
 * 3. POST to our own /api/leads route (not to script.google.com directly —
 *    a server passthrough avoids CORS/opaque-response problems).
 * 4. On ANY failure the caller offers WhatsApp with the lead pre-filled.
 */

export type LeadPayload = LeadInput & { formType: FormType };

/** Serialize the validated lead into the exact object we submit. */
export function serializeLead(input: LeadPayload): LeadPayload {
  return { ...input };
}

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; reason: "network" | "timeout" | "server"; message?: string };

/**
 * Submit a lead through our API passthrough. Never throws; returns a
 * discriminated result so the form can decide between success UI and the
 * WhatsApp fallback.
 */
export async function submitLead(
  payload: LeadPayload
): Promise<SubmitLeadResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    LEAD_SUBMIT_TIMEOUT_MS
  );

  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
      };
      if (data.ok !== false) return { ok: true };
      return { ok: false, reason: "server" };
    }

    // 429 rate limit etc. — server reachable but refused.
    return { ok: false, reason: "server" };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

const line = (label: string, value?: string) =>
  value && value.trim() ? `${label}: ${value.trim()}` : null;

/**
 * Build the WhatsApp fallback message from the EXACT submitted payload —
 * the visitor never has to retype anything.
 */
export function leadWhatsAppMessage(
  lead: LeadPayload,
  context?: { error?: string }
): string {
  const details = [
    line("Name", lead.name),
    line("Phone", lead.phone),
    line("Email", lead.email),
    line("Destination", lead.destination),
    line("Travel date", lead.travelDate),
    line("Travellers", lead.travellers),
    line("Package / Vehicle", lead.package),
    line("Message", lead.message),
  ].filter(Boolean) as string[];

  const parts = [
    `Hello ${site.name}, I would like to plan a trip.`,
    "",
    ...details,
    "",
  ];

  if (context?.error) {
    parts.push(
      `(Note: this enquiry was also sent through your website form — ${context.error} — but it may not have reached you, so sharing it here.)`
    );
  } else {
    parts.push(
      "(Note: this enquiry was also sent through your website form, but it may not have reached you, so sharing it here.)"
    );
  }

  return parts.filter((p) => p !== undefined).join("\n");
}

/** WhatsApp href for a lead fallback. */
export function leadWhatsAppHref(
  lead: LeadPayload,
  context?: { error?: string }
): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    leadWhatsAppMessage(lead, context)
  )}`;
}

export { telHref };
