"use client";

import { useMemo, useState } from "react";
import type { TourPackage } from "@/data/packages";
import PackageGrid from "@/components/packages/PackageGrid";

const filters = [
  { value: "all", label: "All" },
  { value: "sikkim", label: "Sikkim" },
  { value: "darjeeling", label: "Darjeeling" },
  { value: "kalimpong", label: "Kalimpong" },
  { value: "sikkim-darjeeling", label: "Sikkim + Darjeeling" },
  { value: "darjeeling-kalimpong", label: "Darjeeling + Kalimpong" },
  { value: "sikkim-kalimpong", label: "Sikkim + Kalimpong" },
];

export default function PackagesFilter({
  packages,
}: {
  packages: TourPackage[];
}) {
  const [active, setActive] = useState("all");
  const visible = useMemo(
    () =>
      active === "all"
        ? packages
        : packages.filter((p) => p.destinationSlug === active),
    [active, packages]
  );

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter packages by destination"
      >
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            aria-pressed={active === f.value}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active === f.value
                ? "bg-primary text-white"
                : "border border-border bg-card text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground" role="status" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "package" : "packages"}
      </p>

      <div className="mt-6">
        <PackageGrid packages={visible} />
      </div>
    </div>
  );
}
