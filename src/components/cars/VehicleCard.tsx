import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import type { Vehicle } from "@/data/vehicles";
import Badge from "@/components/ui/Badge";

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={vehicle.image}
          alt={vehicle.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="primary">{vehicle.category}</Badge>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {vehicle.capacity}
          </span>
        </div>
        <h3 className="mt-3 font-display text-lg font-bold text-foreground">
          <Link
            href={`/car-rentals/${vehicle.slug}`}
            className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {vehicle.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {vehicle.models.join(" • ")}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {vehicle.description}
        </p>
        <div className="mt-auto pt-4">
          <Link
            href={`/car-rentals/${vehicle.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View Details
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
