import type { Vehicle } from "@/data/vehicles";
import VehicleCard from "@/components/cars/VehicleCard";

export default function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => (
        <VehicleCard key={v.slug} vehicle={v} />
      ))}
    </div>
  );
}
