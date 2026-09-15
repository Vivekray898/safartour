"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Users, Send } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/data/site";

const destinations = [
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
  "Not sure yet",
];

const travellerOptions = ["1", "2", "3", "4", "5", "6", "6+"];

const inputClasses =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function TripSearch() {
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [travellers, setTravellers] = useState("2");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!destination) {
      setError("Please select a destination.");
      return;
    }
    const travellersLabel =
      travellers === "6+" ? "6 or more" : `${travellers} traveller${travellers === "1" ? "" : "s"}`;
    const message = `Hello ${siteConfig.name},

I would like a free quote.

Destination: ${destination}
Travel date: ${date || "Flexible"}
Travellers: ${travellersLabel}

Please share an itinerary and pricing. Thank you!`;
    window.open(getWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }

  const labelClasses =
    "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-border bg-card p-5 shadow-lg sm:p-6"
      aria-label="Plan your trip"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div>
          <label htmlFor="ts-destination" className={labelClasses}>
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
            Destination
          </label>
          <select
            id="ts-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            aria-invalid={!!error && !destination}
            className={inputClasses}
          >
            <option value="">Where do you want to go?</option>
            {destinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ts-date" className={labelClasses}>
            <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden />
            Travel Date
          </label>
          <input
            id="ts-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="ts-travellers" className={labelClasses}>
            <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
            Travellers
          </label>
          <select
            id="ts-travellers"
            value={travellers}
            onChange={(e) => setTravellers(e.target.value)}
            className={inputClasses}
          >
            {travellerOptions.map((t) => (
              <option key={t} value={t}>
                {t === "6+" ? "6 or more" : `${t} Adult${t === "1" ? "" : "s"}`}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Send className="h-4 w-4" aria-hidden />
          Get Free Quote
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
