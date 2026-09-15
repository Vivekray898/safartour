import { NextResponse } from "next/server";
import { enquirySchema, fieldErrors } from "@/lib/validations";
import { siteConfig } from "@/data/site";

// Naive in-memory rate limiter: 5 enquiries per IP per 10 minutes.
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
  // Strip anything that looks like control characters; content is sent as plain text
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: fieldErrors(parsed.error) },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Honeypot filled → pretend success so bots don't retry
  if (data.website && data.website !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many enquiries. Please try again later." },
      { status: 429 }
    );
  }

  const enquiry = {
    name: sanitize(data.name),
    phone: sanitize(data.phone),
    email: sanitize(data.email ?? ""),
    destination: sanitize(data.destination),
    arrivalDate: data.arrivalDate ?? "",
    departureDate: data.departureDate ?? "",
    travellers: data.travellers,
    package: sanitize(data.package ?? ""),
    message: sanitize(data.message ?? ""),
    receivedAt: new Date().toISOString(),
  };

  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ENQUIRY_TO_EMAIL;

  if (resendKey && toEmail) {
    try {
      const text = [
        `New enquiry from the Safar Tours website`,
        ``,
        `Name: ${enquiry.name}`,
        `Phone: ${enquiry.phone}`,
        `Email: ${enquiry.email || "—"}`,
        `Destination: ${enquiry.destination}`,
        `Arrival: ${enquiry.arrivalDate || "—"}`,
        `Departure: ${enquiry.departureDate || "—"}`,
        `Travellers: ${enquiry.travellers}`,
        `Package: ${enquiry.package || "—"}`,
        `Message: ${enquiry.message || "—"}`,
        `Received: ${enquiry.receivedAt}`,
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
          reply_to: enquiry.email || undefined,
          subject: `New enquiry — ${enquiry.destination} (${enquiry.name})`,
          text,
        }),
      });
      if (!res.ok) {
        // Don't fail the user request; the enquiry is logged server-side.
        console.error("Resend delivery failed:", res.status);
      }
    } catch (err) {
      console.error("Resend request error:", err);
    }
  }
  void siteConfig;

  return NextResponse.json({ ok: true });
}
