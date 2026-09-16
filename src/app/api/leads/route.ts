import { NextResponse } from "next/server";
import { leadSchema, fieldErrors } from "@/lib/validations";
import { isFormType, SHEET_TABS, FORM_TYPE_LABELS, type FormType } from "@/config/forms";

// Naive in-memory rate limiter: 5 leads per IP per 10 minutes.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (bucket.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, bucket);
    return true;
  }
  bucket.push(now);
  rateBuckets.set(ip, bucket);
  return false;
}

function sanitize(value: string): string {
  // Strip control characters; content is forwarded as plain text.
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: fieldErrors(parsed.error) },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Honeypot filled → pretend success so bots don't retry.
  if (data.website && data.website !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many enquiries. Please try again shortly." },
      { status: 429 }
    );
  }

  const formType: FormType = isFormType(data.formType) ? data.formType : "tour";
  const lead = {
    formType,
    name: sanitize(data.name),
    phone: sanitize(data.phone),
    email: sanitize(data.email ?? ""),
    destination: sanitize(data.destination),
    travelDate: sanitize(data.travelDate ?? ""),
    travellers: String(data.travellers ?? ""),
    package: sanitize(data.package ?? ""),
    message: sanitize(data.message ?? ""),
    page: sanitize(data.page ?? ""),
    receivedAt: new Date().toISOString(),
  };

  const endpoint = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT ?? "";

  // 1. Primary: forward to the Google Apps Script web app (one spreadsheet,
  //    one tab per form type). The script is server-to-server from here, so
  //    no CORS concerns.
  if (endpoint) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        // Apps Script's doPost(e) receives JSON as e.postData.contents.
        body: JSON.stringify(lead),
        signal: controller.signal,
        // Apps Script returns 302 redirects to script.googleusercontent.com
        // for the final response — follow them.
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (res.ok) {
        return NextResponse.json({ ok: true, stored: "sheets" });
      }
      console.error(
        `Apps Script responded ${res.status} for ${SHEET_TABS[formType]} tab`
      );
    } catch (err) {
      console.error("Apps Script request failed:", err);
    }
  }

  // 2. Secondary: server-side email via Resend (optional; best-effort).
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ENQUIRY_TO_EMAIL;
  let emailed = false;

  if (resendKey && toEmail) {
    try {
      const text = [
        `New ${FORM_TYPE_LABELS[formType]} from the website`,
        ``,
        `Name: ${lead.name}`,
        `Phone: ${lead.phone}`,
        `Email: ${lead.email || "—"}`,
        `Destination: ${lead.destination}`,
        `Travel date: ${lead.travelDate || "—"}`,
        `Travellers: ${lead.travellers || "—"}`,
        `Package / Vehicle: ${lead.package || "—"}`,
        `Message: ${lead.message || "—"}`,
        `Page: ${lead.page || "—"}`,
        `Received: ${lead.receivedAt}`,
        ``,
        `(Google Sheets endpoint not configured or unreachable — this is the email fallback.)`,
      ].join("\n");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Safar Tours Website <enquiries@resend.dev>",
          to: [toEmail],
          reply_to: lead.email || undefined,
          subject: `New ${FORM_TYPE_LABELS[formType]} — ${lead.destination} (${lead.name})`,
          text,
        }),
      });
      emailed = res.ok;
      if (!res.ok) console.error("Resend delivery failed:", res.status);
    } catch (err) {
      console.error("Resend request error:", err);
    }
  }

  // 3. Last resort: structured server log (visible in hosting logs).
  console.log(
    `[LEAD FALLBACK] ${JSON.stringify({ ...lead, emailed })}`
  );

  if (endpoint) {
    // An endpoint IS configured but the write failed — tell the client so it
    // can offer the WhatsApp fallback instead of a false success.
    return NextResponse.json(
      { ok: false, error: "Could not store your enquiry. Please use WhatsApp." },
      { status: 502 }
    );
  }

  // No endpoint configured: the lead is captured in logs/email only. The
  // client should still surface the WhatsApp fallback for zero-loss.
  return NextResponse.json({ ok: true, stored: emailed ? "email" : "log" });
}
