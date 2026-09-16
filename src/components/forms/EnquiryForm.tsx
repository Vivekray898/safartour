"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Send,
  MessageSquare,
  Phone,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { leadSchema, fieldErrors } from "@/lib/validations";
import {
  serializeLead,
  submitLead,
  leadWhatsAppHref,
  type LeadPayload,
} from "@/lib/leads";
import { site, telHref } from "@/config/site";
import type { FormType } from "@/config/forms";

const quickDestinations = [
  "Darjeeling",
  "Sikkim",
  "Kalimpong",
  "Dooars",
  "Meghalaya",
  "Not sure yet",
  "Other",
];

const travellerPills = ["1–2", "3–5", "6–10", "10+"];

const inputClasses =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

type InitialValues = {
  destination?: string;
  package?: string;
};

export default function EnquiryForm({
  formType = "tour",
  initialValues,
  compact = true,
  onSuccess,
}: {
  /** Routes the lead to the right Google Sheet tab. */
  formType?: FormType;
  initialValues?: InitialValues;
  /** Compact hides the message textarea to keep the form short. */
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const [destination, setDestination] = useState(
    initialValues?.destination || "Not sure yet"
  );
  const [customDestination, setCustomDestination] = useState("");
  const [travellers, setTravellers] = useState("1–2");
  const [travelDate, setTravelDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  /** The exact serialized payload of the last submission attempt — kept in
   * state so the success/error UI and WhatsApp fallback render from it. */
  const [lastLead, setLastLead] = useState<LeadPayload | null>(null);

  const effectiveDestination =
    destination === "Other"
      ? customDestination.trim() || "Custom / Other"
      : destination;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return; // double-submit guard
    setErrors({});

    const payload = {
      formType,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      name,
      phone,
      email: "",
      destination: effectiveDestination,
      travelDate,
      travellers,
      package: initialValues?.package || "",
      message,
      website,
    };

    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    // Honeypot filled → it's a bot; quietly pretend success.
    if (website !== "") {
      setStatus("success");
      return;
    }

    // Preserve the exact validated payload — success and WhatsApp fallback
    // both come from this object; never cleared on failure.
    const lead = serializeLead({ ...parsed.data, formType });
    setLastLead(lead);

    setStatus("submitting");
    const result = await submitLead(lead);
    if (result.ok) {
      setStatus("success");
      onSuccess?.();
    } else {
      setStatus("error");
    }
  }

  function whatsappFallbackHref() {
    if (!lastLead) return getWhatsAppHref();
    return leadWhatsAppHref(lastLead, {
      error:
        status === "error"
          ? "the form submission could not be saved"
          : undefined,
    });
  }

  function getWhatsAppHref() {
    return leadWhatsAppHref({
      formType,
      page: "",
      name,
      phone,
      email: "",
      destination: effectiveDestination,
      travelDate,
      travellers,
      package: initialValues?.package || "",
      message,
      website: "",
    });
  }

  if (status === "success") {
    const lead = lastLead;
    return (
      <div
        className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center"
        role="status"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden />
        <h3 className="mt-3 font-display text-xl font-bold text-foreground">
          Thanks — we&apos;ve received your enquiry.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We&apos;ll get back to you shortly
          {lead?.name ? `, ${lead.name}` : ""}. If you&apos;d rather speak
          with us right now:
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href={whatsappFallbackHref()} variant="whatsapp" size="md">
            <MessageSquare className="h-4 w-4" aria-hidden />
            WhatsApp Us
          </Button>
          <Button href={telHref()} variant="outline" size="md">
            <Phone className="h-4 w-4 text-primary" aria-hidden />
            Call {site.phoneDisplay}
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No payment required &bull; No obligation
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {status === "error" && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-semibold">
            We couldn&apos;t save your enquiry just now.
          </p>
          <p className="mt-1">
            Your details are safe — send them instantly on WhatsApp instead:
          </p>
          <a
            href={whatsappFallbackHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1da851] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da851]"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Send my enquiry on WhatsApp
          </a>
          <p className="mt-2 text-xs">
            Or call us:{" "}
            <a href={telHref()} className="font-semibold underline">
              {site.phoneDisplay}
            </a>
          </p>
        </div>
      )}

      {initialValues?.package && (
        <div className="rounded-lg bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary">
          Enquiring for:{" "}
          <strong className="font-semibold">{initialValues.package}</strong>
        </div>
      )}

      {/* 1. Destination selection pills */}
      <div>
        <label
          id="enq-destination-label"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Where would you like to go?
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-labelledby="enq-destination-label"
        >
          {quickDestinations.map((dest) => {
            const isSelected = destination === dest;
            return (
              <button
                type="button"
                key={dest}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setDestination(dest)}
                className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
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
            aria-label="Other destination"
            placeholder="Tell us where you want to go (e.g., Pelling, Tawang, Nathula)"
            value={customDestination}
            onChange={(e) => setCustomDestination(e.target.value)}
            className={`mt-2.5 ${inputClasses}`}
          />
        )}
        {errors.destination && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.destination}
          </p>
        )}
      </div>

      {/* 2. Number of travellers pills */}
      <fieldset>
        <legend className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
          How many travellers?
        </legend>
        <div className="grid grid-cols-4 gap-2">
          {travellerPills.map((count) => {
            const isSelected = travellers === count;
            return (
              <button
                type="button"
                key={count}
                aria-pressed={isSelected}
                onClick={() => setTravellers(count)}
                className={`rounded-lg py-2 text-center text-xs sm:text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
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
      </fieldset>

      {/* 3. Travel dates (optional) */}
      <div>
        <label
          htmlFor="enq-travel-date"
          className="mb-1.5 block text-xs font-medium text-foreground"
        >
          Travel dates <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="enq-travel-date"
          type="text"
          autoComplete="off"
          placeholder="e.g., 10–15 October (approximate is fine)"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* 4. Name & Phone */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="enq-name"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="enq-name"
            type="text"
            autoComplete="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "enq-name-error" : undefined}
            className={inputClasses}
          />
          {errors.name && (
            <p id="enq-name-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="enq-phone"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Phone / WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            id="enq-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+91 98XXX XXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "enq-phone-error" : undefined}
            className={inputClasses}
          />
          {errors.phone && (
            <p id="enq-phone-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* 5. Optional message (non-compact forms only) */}
      {!compact && (
        <div>
          <label
            htmlFor="enq-message"
            className="mb-1.5 block text-xs font-medium text-foreground"
          >
            Message or special requests{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="enq-message"
            rows={3}
            placeholder="Approximate dates, hotel preference, vehicle type, or places you'd like to visit"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "enq-message-error" : undefined}
            className={inputClasses}
          />
          {errors.message && (
            <p id="enq-message-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.message}
            </p>
          )}
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
        No payment required &bull; No obligation &bull; We&apos;ll get back to
        you personally
      </p>

      {/* Secondary Fast Action: Direct WhatsApp */}
      <div className="relative border-t border-border pt-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Prefer not to wait?</span>
          <a
            href={getWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-[#1da851] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da851]"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" aria-hidden />
            Chat directly on WhatsApp →
          </a>
        </div>
      </div>
    </form>
  );
}
