import type { TourPackage } from "@/data/packages";
import PackageCard from "@/components/packages/PackageCard";

export default function PackageGrid({
  packages,
}: {
  packages: TourPackage[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg, i) => (
        <PackageCard key={pkg.slug} pkg={pkg} priority={i < 3} />
      ))}
    </div>
  );
}
