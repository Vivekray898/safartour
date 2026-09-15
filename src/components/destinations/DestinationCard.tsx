import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Destination } from "@/data/destinations";

export default function DestinationCard({
  destination,
  priority = false,
  className = "",
  tall = false,
}: {
  destination: Destination;
  priority?: boolean;
  className?: string;
  /** Tall cards suit asymmetric grids; default is a balanced 4/5. */
  tall?: boolean;
}) {
  return (
    <Link
      href={`/packages/${destination.slug}`}
      className={`group relative block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
      aria-label={`Explore ${destination.name} tour packages`}
    >
      <div
        className={`relative h-full w-full overflow-hidden ${
          tall ? "min-h-[420px] lg:min-h-[560px]" : "aspect-[4/5] sm:aspect-[4/4.4]"
        }`}
      >
        <Image
          src={destination.heroImage}
          alt={destination.heroImageAlt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
            {destination.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/85">
            {destination.shortDescription}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            Explore
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
