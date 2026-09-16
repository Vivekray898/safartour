"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, MessageSquare } from "lucide-react";
import Button from "@/components/ui/Button";
import { enquirySchema, fieldErrors } from "@/lib/validations";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/data/site";

const quickDestinations = [
  "Darjeeling",
  "Sikkim",
  "Kalimpong",
  "Dooars",
  "Other",
];

const travellerPills = ["1–2", "3–5", "6–10", "10+"];

type InitialValues = {
  destination?: string;
  package?: string;
};

export default function EnquiryForm({
  initialValues,
  compact = true,
  onSuccess,
}: {
  initialValues?: InitialValues;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const [destination, setDestination] = useState(
    initialValues?.destination || "Darjeeling"
  );
  const [customDestination, setCustomDestination] = useState("");
  const [travellers, setTravellers] = useState("1–2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const effectiveDestination =
    destination === "Other"
      ? customDestination.trim() || "Custom / Other"
      : destination;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      name,
      phone,
      destination: effectiveDestination,
      travellers,
      package: initialValues?.package || "",
      message: notes,
      website,
    };

    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      onSuccess?.();
    } catch {
      setStatus("error");
    }
  }

  function handleWhatsAppDirect() {
    const msg = `Hello ${siteConfig.name},

I would like to plan a trip.
Destination: ${effectiveDestination}
Travellers: ${travellers}
${name ? `My name: ${name}` : ""}

Please share travel details and guidance. Thank you!`;
    window.open(getWhatsAppUrl(msg), "_blank", "noopener,noreferrer");
  }

  if (status === "success") {
    return (
      <div
        className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center"
        role="status"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden />
        <h3 className="mt-3 font-display text-xl font-bold text-foreground">
          Thank You!
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your enquiry has been received. Our team in Siliguri will review your
          details and reach out to you personally on phone or WhatsApp shortly.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            href={getWhatsAppUrl(
              `Hello Safar Tours, I just submitted an enquiry for ${effectiveDestination}.`
            )}
            variant="whatsapp"
            size="md"
          >
            Chat on WhatsApp
          </Button>
          <Button
            href={`tel:${siteConfig.phone}`}
            variant="outline"
            size="md"
          >
            Call Us
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No payment required • No obligation
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {status === "error" && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          Something went wrong. Please call or reach us directly on WhatsApp.
        </p>
      )}

      {initialValues?.package && (
        <div className="rounded-lg bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary">
          Enquiring for: <strong className="font-semibold">{initialValues.package}</strong>
        </div>
      )}

      {/* 1. Destination selection pills */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
          Where would you like to go?
        </label>
        <div className="flex flex-wrap gap-2">
          {quickDestinations.map((dest) => {
            const isSelected = destination === dest;
            return (
              <button
                type="button"
                key={dest}
                onClick={() => setDestination(dest)}
                className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {dest}
              </button>
            );
          })}
        </div>
        {destination === "Other" && (
          <input
            type="text"
            placeholder="Tell us where you want to go (e.g., Meghalaya, Pelling, Tawang)"
            value={customDestination}
            onChange={(e) => setCustomDestination(e.target.value)}
            className="mt-2.5 w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
        {errors.destination && (
          <p className="mt-1 text-xs text-red-600">{errors.destination}</p>
        )}
      </div>

      {/* 2. Number of travellers pills */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
          How many travellers?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {travellerPills.map((count) => {
            const isSelected = travellers === count;
            return (
              <button
                type="button"
                key={count}
                onClick={() => setTravellers(count)}
                className={`rounded-lg py-2 text-center text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Name & Phone */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="enq-name" className="mb-1.5 block text-xs font-medium text-foreground">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="enq-name"
            type="text"
            autoComplete="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="enq-phone" className="mb-1.5 block text-xs font-medium text-foreground">
            Phone / WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            id="enq-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98XXX XXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Optional note only if non-compact */}
      {!compact && (
        <div>
          <label htmlFor="enq-notes" className="mb-1.5 block text-xs font-medium text-foreground">
            Travel Dates or Special Requests (optional)
          </label>
          <textarea
            id="enq-notes"
            rows={2}
            placeholder="Approximate dates, vehicle preference, or places you'd like to visit"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {/* Honeypot for spam bots */}
      <div className="absolute left-[-9999px] top-auto" aria-hidden="true">
        <label htmlFor="enq-bot-field">Website</label>
        <input
          id="enq-bot-field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Primary Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full font-semibold shadow-sm"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending Details…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden />
            Get a Free Quote
          </>
        )}
      </Button>

      {/* Small Reassurance Underneath */}
      <p className="text-center text-xs text-muted-foreground">
        No payment required • No obligation • We&apos;ll get back to you personally
      </p>

      {/* Secondary Fast Action: Direct WhatsApp */}
      <div className="relative border-t border-border pt-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Prefer not to wait?</span>
          <button
            type="button"
            onClick={handleWhatsAppDirect}
            className="inline-flex items-center gap-1.5 font-medium text-[#1da851] hover:underline"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" aria-hidden />
            Chat directly on WhatsApp →
          </button>
        </div>
      </div>
    </form>
  );
}
