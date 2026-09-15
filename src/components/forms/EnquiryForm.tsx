"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { enquirySchema, fieldErrors } from "@/lib/validations";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/data/site";

const destinationOptions = [
  "Darjeeling",
  "Sikkim",
  "Kalimpong",
  "Sikkim + Darjeeling",
  "Darjeeling + Kalimpong",
  "Sikkim + Kalimpong",
  "Dooars",
  "Meghalaya",
  "Arunachal Pradesh",
  "Car Rental / Transfer",
  "Other / Custom Trip",
];

const inputClasses =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const labelClasses = "mb-1.5 block text-sm font-medium text-foreground";

const errorClasses = "mt-1 text-xs text-red-600";

type InitialValues = {
  destination?: string;
  package?: string;
};

export default function EnquiryForm({
  initialValues,
  compact = false,
}: {
  initialValues?: InitialValues;
  compact?: boolean;
}) {
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    destination: initialValues?.destination ?? "",
    arrivalDate: "",
    departureDate: "",
    travellers: "2",
    package: initialValues?.package ?? "",
    message: "",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const set =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = enquirySchema.safeParse({
      ...values,
      travellers: values.travellers === "" ? NaN : Number(values.travellers),
    });
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
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center"
        role="status"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden />
        <h3 className="mt-4 font-display text-xl font-bold text-foreground">
          Thank You!
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your enquiry has been received. Our travel team will contact you
          shortly — usually within a few hours during business hours.
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            href={getWhatsAppUrl("Hello Safar Tours, I just submitted an enquiry on your website.")}
            variant="whatsapp"
          >
            Chat on WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {status === "error" ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          Something went wrong. Please try again or contact us on WhatsApp.
        </p>
      ) : null}

      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label htmlFor="enq-name" className={labelClasses}>
            Full Name <span aria-hidden>*</span>
          </label>
          <input
            id="enq-name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={set("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "enq-name-error" : undefined}
            className={inputClasses}
            placeholder="Your name"
          />
          {errors.name ? (
            <p id="enq-name-error" className={errorClasses} role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="enq-phone" className={labelClasses}>
            Phone <span aria-hidden>*</span>
          </label>
          <input
            id="enq-phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={set("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "enq-phone-error" : undefined}
            className={inputClasses}
            placeholder="+91 98XXX XXXXX"
          />
          {errors.phone ? (
            <p id="enq-phone-error" className={errorClasses} role="alert">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className={compact ? "" : "sm:col-span-2"}>
          <label htmlFor="enq-email" className={labelClasses}>
            Email <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="enq-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "enq-email-error" : undefined}
            className={inputClasses}
            placeholder="you@example.com"
          />
          {errors.email ? (
            <p id="enq-email-error" className={errorClasses} role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="enq-destination" className={labelClasses}>
            Destination <span aria-hidden>*</span>
          </label>
          <select
            id="enq-destination"
            value={values.destination}
            onChange={set("destination")}
            aria-invalid={!!errors.destination}
            aria-describedby={
              errors.destination ? "enq-destination-error" : undefined
            }
            className={inputClasses}
          >
            <option value="">Select destination</option>
            {destinationOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.destination ? (
            <p
              id="enq-destination-error"
              className={errorClasses}
              role="alert"
            >
              {errors.destination}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="enq-travellers" className={labelClasses}>
            Travellers <span aria-hidden>*</span>
          </label>
          <input
            id="enq-travellers"
            type="number"
            min={1}
            max={100}
            value={values.travellers}
            onChange={set("travellers")}
            aria-invalid={!!errors.travellers}
            aria-describedby={
              errors.travellers ? "enq-travellers-error" : undefined
            }
            className={inputClasses}
          />
          {errors.travellers ? (
            <p
              id="enq-travellers-error"
              className={errorClasses}
              role="alert"
            >
              {errors.travellers}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="enq-arrival" className={labelClasses}>
            Arrival Date
          </label>
          <input
            id="enq-arrival"
            type="date"
            value={values.arrivalDate}
            onChange={set("arrivalDate")}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="enq-departure" className={labelClasses}>
            Departure Date
          </label>
          <input
            id="enq-departure"
            type="date"
            value={values.departureDate}
            onChange={set("departureDate")}
            className={inputClasses}
          />
        </div>

        {values.package ? (
          <div className={compact ? "" : "sm:col-span-2"}>
            <label htmlFor="enq-package" className={labelClasses}>
              Package
            </label>
            <input
              id="enq-package"
              type="text"
              value={values.package}
              onChange={set("package")}
              readOnly
              className={`${inputClasses} bg-muted/30`}
            />
          </div>
        ) : null}

        <div className={compact ? "" : "sm:col-span-2"}>
          <label htmlFor="enq-message" className={labelClasses}>
            Message
          </label>
          <textarea
            id="enq-message"
            rows={compact ? 3 : 4}
            value={values.message}
            onChange={set("message")}
            className={inputClasses}
            placeholder="Tell us about your travel plans (optional)"
          />
        </div>
      </div>

      {/* Honeypot — hidden from humans */}
      <div className="absolute left-[-9999px] top-auto" aria-hidden="true">
        <label htmlFor="enq-website">Website</label>
        <input
          id="enq-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set("website")}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden />
            Get Free Quote
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Prefer to talk? Call us at{" "}
        <a
          href={`tel:${siteConfig.phone}`}
          className="font-medium text-primary hover:underline"
        >
          {siteConfig.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
