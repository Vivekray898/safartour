import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import type { TourPackage } from "@/data/packages";
import { getDestination } from "@/data/destinations";
import Badge from "@/components/ui/Badge";

export default function PackageCard({
  pkg,
  priority = false,
}: {
  pkg: TourPackage;
  priority?: boolean;
}) {
  const destination = getDestination(pkg.destinationSlug);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={pkg.heroImage}
          alt={pkg.heroImageAlt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
        <div className="absolute left-3 top-3">
          <Badge variant="light">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {pkg.duration}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
          {destination?.name ?? pkg.destinationSlug}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-bold text-foreground">
          <Link
            href={`/packages/${pkg.destinationSlug}/${pkg.slug}`}
            className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {pkg.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {pkg.description}
        </p>
        <p className="mt-3 text-sm text-muted">
          {pkg.highlights.slice(0, 3).join(" • ")}
        </p>
        <div className="mt-auto pt-4">
          <Link
            href={`/packages/${pkg.destinationSlug}/${pkg.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View Package
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
