import type { Destination } from "@/data/destinations";
import DestinationCard from "@/components/destinations/DestinationCard";

export default function DestinationGrid({
  destinations,
}: {
  destinations: Destination[];
}) {
  if (destinations.length === 0) return null;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {destinations.map((d, i) => (
        <DestinationCard key={d.slug} destination={d} priority={i < 3} />
      ))}
    </div>
  );
}
