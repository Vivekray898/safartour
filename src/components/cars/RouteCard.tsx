import Link from "next/link";
import { ArrowRight, ArrowRightLeft, Clock } from "lucide-react";
import type { RouteInfo } from "@/data/routes";
import Badge from "@/components/ui/Badge";

export default function RouteCard({ route }: { route: RouteInfo }) {
  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{route.routeType}</Badge>
        {route.duration ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {route.duration.replace("~", "approx. ")}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 flex items-start gap-2 font-display text-base font-bold leading-snug text-foreground">
        <ArrowRightLeft
          className="mt-1 h-4 w-4 shrink-0 text-primary"
          aria-hidden
        />
        <Link
          href={`/routes/${route.slug}`}
          className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {route.from} → {route.to}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
        {route.description}
      </p>
      <Link
        href={`/routes/${route.slug}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Get Current Fare
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </article>
  );
}
