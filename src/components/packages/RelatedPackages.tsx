import type { TourPackage } from "@/data/packages";
import PackageCard from "@/components/packages/PackageCard";

export default function RelatedPackages({
  packages,
}: {
  packages: TourPackage[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((p) => (
        <PackageCard key={p.slug} pkg={p} />
      ))}
    </div>
  );
}
