import type { Destination } from "@/data/destinations";
import DestinationCard from "@/components/destinations/DestinationCard";

export default function DestinationGrid({
  destinations,
}: {
  destinations: Destination[];
}) {
  if (destinations.length === 0) return null;
  const [first, ...rest] = destinations;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <DestinationCard destination={first} priority tall />
      <div className="grid gap-5 sm:grid-cols-2">
        {rest.map((d, i) => (
          <DestinationCard key={d.slug} destination={d} priority={i === 0} />
        ))}
      </div>
    </div>
  );
}
