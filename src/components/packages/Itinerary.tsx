"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { ItineraryDay } from "@/data/packages";

function DayCard({ day }: { day: ItineraryDay }) {
  const [open, setOpen] = useState(true);
  return (
    <li className="relative pl-10 sm:pl-14">
      {/* Timeline dot & line */}
      <span
        className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white sm:h-9 sm:w-9 sm:text-sm"
        aria-hidden
      >
        {day.day}
      </span>
      <span
        className="absolute left-[13px] top-9 h-[calc(100%-1rem)] w-0.5 bg-border sm:left-[17px] sm:top-11"
        aria-hidden
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Day {String(day.day).padStart(2, "0")}
            </p>
            <h3 className="mt-1 font-display text-base font-bold text-foreground sm:text-lg">
              {day.title}
            </h3>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
        {open ? (
          <div className="mt-3">
            <p className="text-sm leading-relaxed text-muted">
              {day.description}
            </p>
            <ul className="mt-3 space-y-1.5">
              {day.activities.map((a) => (
                <li
                  key={a}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <MapPin
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden
                  />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function Itinerary({ days }: { days: ItineraryDay[] }) {
  return (
    <ol className="space-y-4">
      {days.map((day) => (
        <DayCard key={day.day} day={day} />
      ))}
    </ol>
  );
}
