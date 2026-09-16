"use client";

import { useMemo, useState } from "react";
import type { TourPackage } from "@/data/packages";
import PackageGrid from "@/components/packages/PackageGrid";

const destinationFilters = [
  { value: "all", label: "All" },
  { value: "sikkim", label: "Sikkim" },
  { value: "darjeeling", label: "Darjeeling" },
  { value: "kalimpong", label: "Kalimpong" },
  { value: "sikkim-darjeeling", label: "Sikkim + Darjeeling" },
  { value: "darjeeling-kalimpong", label: "Darjeeling + Kalimpong" },
  { value: "sikkim-kalimpong", label: "Sikkim + Kalimpong" },
];

/**
 * Traveller-type chips are derived from each package's own `bestFor` text —
 * we only surface categories the packages genuinely describe, so nothing is
 * invented for SEO.
 */
const travellerFilters = [
  { value: "family", label: "Family trips", pattern: /famil|children|senior/i },
  { value: "couple", label: "Couples & honeymoon", pattern: /couple|honeymoon/i },
  { value: "wildlife", label: "Wildlife", pattern: /wildlife/i },
  { value: "adventure", label: "Adventure", pattern: /adventure|mountain devotee/i },
];

function matchesTraveller(pkg: TourPackage, value: string): boolean {
  const filter = travellerFilters.find((f) => f.value === value);
  if (!filter) return true;
  return filter.pattern.test(pkg.bestFor ?? "");
}

export default function PackagesFilter({
  packages,
}: {
  packages: TourPackage[];
}) {
  const [destination, setDestination] = useState("all");
  const [traveller, setTraveller] = useState("all");

  const availableTravellers = useMemo(
    () =>
      travellerFilters.filter((f) =>
        packages.some((p) => f.pattern.test(p.bestFor ?? ""))
      ),
    [packages]
  );

  const visible = useMemo(
    () =>
      packages.filter(
        (p) =>
          (destination === "all" || p.destinationSlug === destination) &&
          matchesTraveller(p, traveller)
      ),
    [destination, traveller, packages]
  );

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      active
        ? "bg-primary text-white"
        : "border border-border bg-card text-foreground hover:border-primary hover:text-primary"
    }`;

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter packages by destination"
      >
        {destinationFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setDestination(f.value)}
            aria-pressed={destination === f.value}
            className={chip(destination === f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {availableTravellers.length > 0 && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter packages by traveller type"
        >
          {availableTravellers.map((f) => (
            <button
              key={f.value}
              onClick={() => setTraveller(traveller === f.value ? "all" : f.value)}
              aria-pressed={traveller === f.value}
              className={chip(traveller === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground" role="status" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "package" : "packages"}
      </p>

      <div className="mt-6">
        <PackageGrid packages={visible} />
      </div>
    </div>
  );
}
